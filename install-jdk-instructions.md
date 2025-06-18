# Установка JDK и сборка Android APK

Это руководство поможет вам настроить Java Development Kit (JDK) на macOS, а затем собрать Android APK для вашего приложения AI Assistant двумя способами: локально с помощью Gradle и через облачный сервис EAS Build.

## Раздел 1: Установка Java Development Kit (JDK) на macOS

JDK необходим для компиляции Android-приложений.

### Способ 1: Установка JDK через Homebrew (рекомендуется)

1.  **Установите Homebrew**, если он еще не установлен. Откройте Терминал и выполните:
    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```
    Следуйте инструкциям на экране.

2.  **Установите OpenJDK (например, версию 17, которая является LTS):**
    ```bash
    brew install openjdk@17
    ```

3.  **Добавьте JDK в системный PATH.** Homebrew обычно выводит инструкцию после установки. Для OpenJDK 17 и Zsh (стандартная оболочка в новых macOS) это может выглядеть так:
    *   Для Apple Silicon (M1/M2/M3):
        ```bash
        echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
        ```
    *   Для Intel Macs:
        ```bash
        echo 'export PATH="/usr/local/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
        ```
    *   После добавления перезапустите Терминал или выполните:
        ```bash
        source ~/.zshrc
        ```

4.  **(Опционально) Укажите `JAVA_HOME`**:
    Некоторые инструменты могут требовать эту переменную.
    *   Для Apple Silicon:
        ```bash
        echo 'export JAVA_HOME=$(/usr/libexec/java_home -v17)' >> ~/.zshrc
        ```
    *   Для Intel Macs (путь может отличаться в зависимости от установки):
        ```bash
        echo 'export JAVA_HOME=/Library/Java/JavaVirtualMachines/openjdk-17.jdk/Contents/Home' >> ~/.zshrc 
        # Точный путь можно узнать через /usr/libexec/java_home -v17
        ```
    *   Перезапустите Терминал или выполните `source ~/.zshrc`.


### Способ 2: Скачивание с официального сайта

*   **Adoptium Temurin (OpenJDK)**: Перейдите на [adoptium.net](https://adoptium.net), скачайте установщик PKG для macOS и вашей архитектуры (arm64 для Apple Silicon, x64 для Intel).
*   **Oracle JDK**: Перейдите на сайт Oracle, скачайте JDK для macOS и установите.

После установки через DMG/PKG, `java_home` обычно настраивается автоматически.

### Проверка установки JDK

Откройте новый Терминал и выполните команды:
```bash
java -version
javac -version
/usr/libexec/java_home -V 
```
Вы должны увидеть информацию об установленной версии JDK (например, 17.x.x).

## Раздел 2: Настройка переменной окружения ANDROID_HOME (если требуется)

Эта переменная указывает на местоположение вашего Android SDK. Android Studio обычно устанавливает SDK в `~/Library/Android/sdk`.

1.  **Проверьте, установлена ли переменная**:
    ```bash
    echo $ANDROID_HOME
    ```
2.  **Если переменная не установлена или путь неверный**, добавьте ее в ваш конфигурационный файл оболочки (например, `~/.zshrc`):
    ```bash
    echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
    echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
    echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
    # Для старых версий SDK могут понадобиться tools и tools/bin
    # echo 'export PATH=$PATH:$ANDROID_HOME/tools' >> ~/.zshrc
    # echo 'export PATH=$PATH:$ANDROID_HOME/tools/bin' >> ~/.zshrc
    ```
3.  **Перезапустите Терминал** или выполните `source ~/.zshrc`.

## Раздел 3: Локальная сборка APK с помощью Gradle (для тестирования)

Этот метод создает отладочный APK, который не требует сложной настройки ключей подписи и подходит для быстрого тестирования на устройстве или эмуляторе.

1.  **Убедитесь, что у вас есть нативный Android проект.** Если вы еще этого не сделали, сгенерируйте его из вашего Expo проекта:
    ```bash
    cd /Users/vyache/factoryai/clean-ai-app/ai-assistant 
    npx expo prebuild --platform android --clean 
    ```
    Эта команда создаст папку `android` в корне вашего проекта.

2.  **Перейдите в директорию `android`**:
    ```bash
    cd /Users/vyache/factoryai/clean-ai-app/ai-assistant/android
    ```

3.  **Очистите предыдущие сборки (рекомендуется)**:
    ```bash
    ./gradlew clean
    ```

4.  **Соберите Debug APK**:
    ```bash
    ./gradlew assembleDebug
    ```
    Эта команда использует отладочный ключ, который автоматически генерируется Android SDK.

5.  **Найдите ваш APK**:
    После успешной сборки APK-файл будет находиться здесь:
    `android/app/build/outputs/apk/debug/app-debug.apk`

6.  **Установка на устройство/эмулятор**:
    *   Скопируйте `app-debug.apk` на ваше Android устройство или эмулятор.
    *   Разрешите установку из неизвестных источников на устройстве (Settings → Security или Apps → Special app access).
    *   Установите APK, найдя его через файловый менеджер и тапнув по нему.
    *   Или используйте ADB (Android Debug Bridge), если он настроен:
        ```bash
        adb install path/to/your/app-debug.apk 
        ```
        (Замените `path/to/your/app-debug.apk` на реальный путь к файлу).

## Раздел 4: Альтернатива - Сборка через EAS Build (Облачная сборка Expo)

EAS Build — это облачный сервис Expo, который может собирать APK и AAB для вас. Это может быть удобнее, если локальная настройка вызывает трудности.

1.  **Убедитесь, что EAS CLI установлен и вы авторизованы**:
    ```bash
    npm install -g eas-cli 
    eas login 
    ```
    (Если вы уже авторизованы, этот шаг можно пропустить).

2.  **Проблема "Invalid UUID appId" и ее решение**:
    Эта ошибка означает, что ваш локальный проект не связан с проектом на серверах EAS или связан неправильно.
    *   **Проверьте `app.config.js`**:
        Убедитесь, что в `app.config.js` в секции `extra.eas.projectId` указан корректный ID вашего проекта EAS.
        ```javascript
        // app.config.js
        module.exports = {
          // ...
          extra: {
            // ...
            eas: {
              projectId: 'ваше-eas-project-id' // Замените на реальный ID, если он есть
            }
          }
        };
        ```
    *   **Инициализация или привязка проекта в EAS**:
        *   Если у вас еще нет проекта в EAS, создайте его на [expo.dev/dashboard](https://expo.dev/dashboard) и скопируйте Project ID.
        *   Если вы хотите, чтобы EAS CLI помог вам:
            *   Если поле `extra.eas.projectId` в `app.config.js` заполнено, но вызывает ошибку, временно удалите или закомментируйте его.
            *   В корне вашего проекта выполните:
                ```bash
                eas project:init
                ```
                EAS CLI предложит создать новый проект в вашем аккаунте Expo или привязаться к существующему. Выберите подходящий вариант.
            *   После этого `projectId` должен автоматически добавиться в конфигурацию вашего приложения.

3.  **Конфигурация сборки (файл `eas.json`)**:
    Убедитесь, что ваш файл `eas.json` содержит профиль для сборки тестового APK. Профиль `local` или `preview` подходит. Например, профиль `local` из вашего `eas.json`:
    ```json
    {
      "cli": {
        "version": ">= 7.6.0",
        "appVersionSource": "local" 
      },
      "build": {
        // ... другие профили ...
        "local": { // Этот профиль подходит для тестового APK
          "channel": "local",
          "distribution": "internal",
          "android": {
            "buildType": "apk",
            "image": "latest", // Или укажите конкретный образ, например "ubuntu-22.04-jdk-17-ndk-r25c"
            "gradleCommand": ":app:assembleDebug", // Собирает debug APK
            "withoutCredentials": true // Не требует учетных данных для подписи
          },
          "env": {
            "EXPO_PUBLIC_APP_ENV": "local"
          }
        }
      }
      // ...
    }
    ```
    Если `eas.json` отсутствует или не настроен, выполните:
    ```bash
    eas build:configure
    ```
    EAS CLI поможет вам создать или обновить этот файл.

4.  **Запуск сборки APK через EAS**:
    Для сборки тестового APK с использованием профиля `local` (который собирает debug APK без подписи):
    ```bash
    eas build -p android --profile local
    ```
    Или, если вы настроили профиль `preview` для сборки APK:
    ```bash
    eas build -p android --profile preview
    ```

5.  **Получение APK**:
    *   После запуска команды сборки, EAS CLI предоставит ссылку на страницу сборки на сайте `expo.dev`.
    *   Следите за процессом сборки. После успешного завершения вы сможете скачать APK прямо со страницы сборки.

## Завершение

Теперь у вас есть два способа собрать APK для тестирования: локально с помощью Gradle (требует JDK и Android SDK) или через облачный сервис EAS Build. Выберите тот, который вам удобнее. Не забывайте тестировать собранный APK на реальных устройствах или эмуляторах.
