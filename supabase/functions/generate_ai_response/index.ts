// supabase/functions/generate_ai_response/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Define available models and a default model
const AVAILABLE_MODELS = ["gpt-4.1", "gpt-4.1-mini", "gpt-4o", "gpt-4o-mini"];
const DEFAULT_MODEL = "gpt-3.5-turbo"; // Fallback model

// Types
interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RequestBody {
  chatId: string;
  userMessage: string;
  assistantId: string;
  modelSettings?: {
    temperature?: number;
    max_tokens?: number;
    model_name?: string; // User-selected model
  };
}

interface DbMessage {
  id?: string;
  chat_id: string;
  sender_type: "user" | "ai";
  content: string;
  created_at?: string;
}

// Helper function to call OpenAI API with fetch and retry logic
async function callOpenAI(
  messages: ChatMessage[],
  model: string = DEFAULT_MODEL, // Default model for the call
  temperature: number = 0.7,
  max_tokens: number = 1000,
  maxRetries: number = 3,
  initialBackoffMs: number = 500
): Promise<string> {
  const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";

  if (!openaiApiKey) {
    console.error("OpenAI API Key is missing.");
    throw new Error("OpenAI API Key is not configured.");
  }

  let attempt = 0;
  let backoff = initialBackoffMs;

  while (attempt < maxRetries) {
    attempt++;
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens,
        }),
      });

      if (response.status === 429) {
        // Too Many Requests, retry with exponential backoff
        console.warn(
          `OpenAI 429 received. Retrying attempt ${attempt}/${maxRetries} after ${backoff} ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoff));
        backoff *= 2; // Exponential back-off
        continue; // Try again
      }

      if (!response.ok) {
        let errorDetails = "";
        try {
          errorDetails = await response.text();
        } catch (_) {
          /* ignore parse errors */
        }
        console.error(
          `OpenAI API error: status=${response.status} ${response.statusText}; body=${errorDetails}`
        );
        throw new Error(
          `OpenAI API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "";
    } catch (error) {
      console.error(`Error calling OpenAI (attempt ${attempt}):`, error?.stack || error);
      if (attempt >= maxRetries) {
        throw error; // Re-throw if max retries reached
      }
      // For other errors or if retries are not exhausted for 429
      await new Promise((resolve) => setTimeout(resolve, backoff));
      backoff *= 2;
    }
  }
  throw new Error("Max retries exceeded while calling OpenAI"); // Should be reached if all retries fail
}

// Main handler function
serve(async (req: Request) => {
  try {
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    };

    // Handle OPTIONS request for CORS
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    // Parse request body
    const body: RequestBody = await req.json();
    const { chatId, userMessage, assistantId, modelSettings } = body;

    // Validate required fields
    if (!chatId || !userMessage || !assistantId) {
      console.error("Missing required fields: chatId, userMessage, or assistantId");
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey =
      Deno.env.get("SERVICE_ROLE_KEY") || // Preferred name
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""; // Fallback for backward compatibility
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";

    // Debug log (without exposing actual keys)
    console.log("Environment variables loaded:", {
      supabaseUrlPresent: !!supabaseUrl,
      supabaseServiceKeyPresent: !!supabaseServiceKey,
      openaiApiKeyPresent: !!openaiApiKey
    });

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      console.error("Server configuration error: Missing Supabase URL, Service Key, or OpenAI Key.");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get assistant information
    const { data: assistant, error: assistantError } = await supabase
      .from("assistants")
      .select("*")
      .eq("id", assistantId)
      .single();

    if (assistantError || !assistant) {
      console.error(`Assistant not found for ID: ${assistantId}`, assistantError);
      return new Response(
        JSON.stringify({ error: "Assistant not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get chat information to verify ownership
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("*")
      .eq("id", chatId)
      .single();

    if (chatError || !chat) {
      console.error(`Chat not found for ID: ${chatId}`, chatError);
      return new Response(
        JSON.stringify({ error: "Chat not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get previous messages from the chat
    const { data: previousMessages, error: messagesError } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching chat history:", messagesError);
      return new Response(
        JSON.stringify({ error: "Error fetching chat history" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Save user message to database
    const userMessageObject: DbMessage = {
      chat_id: chatId,
      sender_type: "user",
      content: userMessage,
    };

    const { data: savedUserMessage, error: userMessageError } = await supabase
      .from("messages")
      .insert(userMessageObject)
      .select()
      .single();

    if (userMessageError) {
      console.error("Error saving user message:", userMessageError);
      return new Response(
        JSON.stringify({ error: "Error saving user message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare messages for OpenAI API
    const messages: ChatMessage[] = [];

    // Add system prompt from assistant
    messages.push({
      role: "system",
      content: assistant.prompt,
    });

    // Add previous messages
    if (previousMessages && previousMessages.length > 0) {
      for (const msg of previousMessages) {
        messages.push({
          role: msg.sender_type === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    // Add current user message
    messages.push({
      role: "user",
      content: userMessage,
    });

    // Set up OpenAI API parameters
    const temperature = modelSettings?.temperature || 0.7;
    const max_tokens = modelSettings?.max_tokens || 1000;
    
    // Determine the model to use
    let selectedModel = DEFAULT_MODEL;
    if (modelSettings?.model_name && AVAILABLE_MODELS.includes(modelSettings.model_name)) {
      selectedModel = modelSettings.model_name;
    }
    console.log(`[AI Request] Using model: ${selectedModel} for chat ID: ${chatId}`);


    // Call OpenAI API using our fetch helper function
    const aiResponse = await callOpenAI(
      messages,
      selectedModel,
      temperature,
      max_tokens
    );

    // Save AI response to database
    const aiMessageObject: DbMessage = {
      chat_id: chatId,
      sender_type: "ai",
      content: aiResponse,
    };

    const { data: savedAiMessage, error: aiMessageError } = await supabase
      .from("messages")
      .insert(aiMessageObject)
      .select()
      .single();

    if (aiMessageError) {
      console.error("Error saving AI message:", aiMessageError);
      return new Response(
        JSON.stringify({ error: "Error saving AI message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update chat title if it's the first message (user + AI = 2 messages)
    if (previousMessages.length === 0 && !chat.title) {
      // Generate a title based on the first user message and AI response
      const titleMessages: ChatMessage[] = [
        {
          role: "system",
          content: "Generate a short, concise title (maximum 6 words) for a conversation that starts with this message. Return only the title without quotes or additional text.",
        },
        {
          role: "user",
          content: userMessage, // Use the first user message for context
        }
      ];

      try {
        const generatedTitle = await callOpenAI(
          titleMessages,
          "gpt-3.5-turbo", // Use a cost-effective model for title generation
          0.7,
          20 // Max tokens for a short title
        ) || "New Conversation";

        // Update chat title
        await supabase
          .from("chats")
          .update({ title: generatedTitle.trim() })
          .eq("id", chatId);
      } catch (error) {
        console.error("Error generating title:", error?.stack || error);
        // Continue execution even if title generation fails, default title will be used or no title
      }
    }

    // Return the AI response
    return new Response(
      JSON.stringify({
        aiResponse,
        messageId: savedAiMessage.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    // Log full stack for easier debugging inside the Supabase logs
    console.error("Error processing request:", error?.stack || error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
    );
  }
});