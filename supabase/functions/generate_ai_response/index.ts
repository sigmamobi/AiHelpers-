// supabase/functions/generate_ai_response/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.26.0";
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

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
    model_name?: string;
  };
}

interface DbMessage {
  id?: string;
  chat_id: string;
  sender_type: "user" | "ai";
  content: string;
  created_at?: string;
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
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY") || "";

    if (!supabaseUrl || !supabaseServiceKey || !openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Initialize OpenAI client
    const configuration = new Configuration({
      apiKey: openaiApiKey,
    });
    const openai = new OpenAIApi(configuration);

    // Get assistant information
    const { data: assistant, error: assistantError } = await supabase
      .from("assistants")
      .select("*")
      .eq("id", assistantId)
      .single();

    if (assistantError || !assistant) {
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
    const model = modelSettings?.model_name || "gpt-4";

    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model,
      messages,
      temperature,
      max_tokens,
    });

    // Extract AI response
    const aiResponse = completion.data.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";

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
      return new Response(
        JSON.stringify({ error: "Error saving AI message" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update chat title if it's the first message
    if (previousMessages.length === 0 && !chat.title) {
      // Generate a title based on the first message
      const titleCompletion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Generate a short, concise title (maximum 6 words) for a conversation that starts with this message. Return only the title without quotes or additional text.",
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.7,
        max_tokens: 20,
      });

      const generatedTitle = titleCompletion.data.choices[0]?.message?.content || "New Conversation";

      // Update chat title
      await supabase
        .from("chats")
        .update({ title: generatedTitle })
        .eq("id", chatId);
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
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
