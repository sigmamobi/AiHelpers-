# Локальная сборка Android APK с собственным Keystore

Это руководство поможет вам создать подписанный Android APK (Android Package Kit) для вашего приложения локально, используя собственный keystore. Это может быть полезно, если у вас возникают проблемы с облачной сборкой EAS или если вам нужен полный контроль над процессом подписи для тестовых целей.

## Предварительные требования

Перед началом убедитесь, что у вас установлены:

1.  **Java Development Kit (JDK)**: Версия 8 или выше. Вы можете проверить версию командой `java -version`.
2.  **Android Studio и Android SDK**: Установите Android Studio, который включает Android SDK и необходимые инструменты командной строки. Убедитесь, что переменная окружения `ANDROID_HOME` (или `ANDROID_SDK_ROOT`) указывает на директорию вашего SDK.
3.  **Проект Expo**: Ваш текущий проект Expo.

## Шаг 1: Подготовка Android-проекта

Если в корне вашего Expo-проекта еще нет папки `android`, вам нужно ее сгенерировать. Это фактически переведет ваш проект в Bare Workflow для платформы Android, давая вам доступ к нативным файлам.

Выполните одну из следующих команд в корне вашего Expo-проекта:

```bash
npx expo prebuild --platform android
```

Или, если вы хотите сразу запустить сборку, которая также сгенерирует `android` папку:

```bash
npx expo run:android
```

После выполнения этой команды у вас появится папка `android` в корне проекта.

## Шаг 2: Создание Keystore (Хранилища ключей)

Keystore — это файл, содержащий криптографические ключи, используемые для подписи вашего приложения.

1.  **Откройте терминал или командную строку.**
2.  **Перейдите в директорию `android/app` вашего проекта**:
    ```bash
    cd android/app 
    ```
    (Если вы находитесь в корне проекта Expo, то команда будет `cd android/app`)

3.  **Выполните команду `keytool` для генерации keystore**:
    Замените `<your-release-key-alias>` и `<your-keystore-name>.keystore` на ваши значения.

    ```bash
    keytool -genkeypair -v -keystore <your-keystore-name>.keystore -alias <your-release-key-alias> -keyalg RSA -keysize 2048 -validity 10000
    ```

    *   **`<your-keystore-name>.keystore`**: Имя вашего файла keystore (например, `my-ai-assistant-release-key.keystore`).
    *   **`<your-release-key-alias>`**: Псевдоним для вашего ключа (например, `ai-assistant-alias`).
    *   **`-keyalg RSA`**: Алгоритм генерации ключа.
    *   **`-keysize 2048`**: Размер ключа.
    *   **`-validity 10000`**: Срок действия ключа в днях (примерно 27 лет).

4.  **Введите пароли и информацию**:
    *   Вас попросят ввести пароль для keystore. **Запомните или надежно сохраните этот пароль.**
    *   Затем вас попросят ввести пароль для ключа (alias). Рекомендуется использовать тот же пароль, что и для keystore, для простоты.
    *   Далее нужно будет ввести различную информацию (имя, организация и т.д.). Для тестового проекта можно ввести примерные данные или нажимать Enter, чтобы пропустить некоторые поля, но для релизных ключей важно указывать корректную информацию.
    *   В конце подтвердите правильность информации, введя `yes`.

5.  **Файл keystore будет создан** в текущей директории (`android/app`).

### Важно: Безопасность Keystore
*   **Храните файл `.keystore` в надежном месте.** Потеря этого файла сделает невозможным обновление вашего приложения в Google Play Store (если вы решите его публиковать).
*   **Никогда не добавляйте файл `.keystore` в систему контроля версий (Git).** Добавьте его имя в ваш `.gitignore` файл:
    ```gitignore
    # Keystores
    *.keystore
    ```
*   **Надежно сохраните пароли** от keystore и от alias ключа.

## Шаг 3: Настройка Gradle для использования Keystore

Теперь нужно указать Gradle, как использовать ваш новый keystore для подписи приложения.

1.  **Создайте файл `keystore.properties`**:
    В директории `android` (не `android/app`) вашего проекта создайте файл с именем `keystore.properties`.
    ```bash
    # Находясь в корне проекта Expo:
    touch android/keystore.properties 
    ```

2.  **Добавьте `keystore.properties` в `.gitignore`**:
    Убедитесь, что `keystore.properties` добавлен в ваш `.gitignore` файл, так как он будет содержать пароли.
    ```gitignore
    # Keystore properties
    keystore.properties
    ```

3.  **Заполните `keystore.properties`**:
    Откройте `android/keystore.properties` и добавьте следующие строки, заменив значения на ваши:
    ```properties
    MYAPP_RELEASE_STORE_FILE=<your-keystore-name>.keystore
    MYAPP_RELEASE_KEY_ALIAS=<your-release-key-alias>
    MYAPP_RELEASE_STORE_PASSWORD=<your-keystore-password>
    MYAPP_RELEASE_KEY_PASSWORD=<your-key-alias-password>
    ```
    *   `<your-keystore-name>.keystore`: Имя файла, который вы создали (например, `my-ai-assistant-release-key.keystore`). Путь указывается относительно папки `android/app`.
    *   `<your-release-key-alias>`: Псевдоним ключа.
    *   `<your-keystore-password>`: Пароль от keystore.
    *   `<your-key-alias-password>`: Пароль от alias ключа.

4.  **Отредактируйте `android/app/build.gradle`**:
    Откройте файл `android/app/build.gradle`. Найдите секцию `android { ... }` и внутри нее блок `signingConfigs { ... }`. Если его нет, добавьте. Затем настройте `release` конфигурацию подписи.

    Пример:
    ```gradle
    ...
    android {
        ...
        defaultConfig { ... }

        signingConfigs {
            release {
                if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                    storeFile file(MYAPP_RELEASE_STORE_FILE) // Путь относительно android/app
                    storePassword MYAPP_RELEASE_STORE_PASSWORD
                    keyAlias MYAPP_RELEASE_KEY_ALIAS
                    keyPassword MYAPP_RELEASE_KEY_PASSWORD
                }
            }
        }

        buildTypes {
            release {
                ...
                signingConfig signingConfigs.release // Используем созданную конфигурацию подписи
                ...
            }
            debug {
                // Для debug сборок обычно используется автоматически генерируемый debug.keystore
                // или можно настроить аналогично release, если нужно
                signingConfig signingConfigs.debug 
            }
        }
        ...
    }
    ...
    ```
    *   Убедитесь, что `storeFile file(...)` указывает на правильное имя вашего keystore файла, который должен находиться в `android/app/`.
    *   Если у вас уже есть `signingConfigs.debug`, оставьте его как есть.

    **Примечание**: Если вы только что выполнили `expo prebuild`, структура `build.gradle` может немного отличаться, но основная идея — найти или добавить `signingConfigs` и указать `signingConfig signingConfigs.release` для `buildTypes.release`.

## Шаг 4: Сборка APK

Теперь, когда все настроено, вы можете собрать подписанный APK.

1.  **Откройте терминал в корневой директории вашего Expo-проекта.**
2.  **Перейдите в директорию `android`**:
    ```bash
    cd android
    ```
3.  **Очистите предыдущие сборки (рекомендуется)**:
    ```bash
    ./gradlew clean
    ```
4.  **Соберите релизный APK**:
    ```bash
    ./gradlew assembleRelease
    ```
    Эта команда соберет APK, подписанный ключом из вашего keystore.

    Если вам нужна отладочная версия APK (обычно подписывается автоматически генериемым debug ключом):
    ```bash
    ./gradlew assembleDebug
    ```

5.  **Найдите ваш APK**:
    После успешной сборки APK-файл будет находиться здесь:
    *   Релизный APK: `android/app/build/outputs/apk/release/app-release.apk`
    *   Отладочный APK: `android/app/build/outputs/apk/debug/app-debug.apk`

## Шаг 5: Установка и Тестирование APK

1.  **Скопируйте APK на ваше Android устройство** или эмулятор.
2.  **Разрешите установку из неизвестных источников** на вашем устройстве (Settings → Security или Apps → Special app access).
3.  **Установите APK**, найдя его через файловый менеджер и тапнув по нему.
    Или используйте ADB (Android Debug Bridge), если он настроен:
    ```bash
    adb install path/to/your/app-release.apk
    ```
4.  **Запустите и протестируйте приложение.**

## Важные Замечания

*   **Безопасность Keystore**: Повторимся, храните ваш `.keystore` файл и его пароли в строжайшей секретности. Потеря ключа означает, что вы не сможете публиковать обновления для вашего приложения под тем же именем в Google Play.
*   **Резервное копирование**: Сделайте несколько резервных копий вашего `.keystore` файла и паролей в разных безопасных местах.
*   **Google Play Store**: Если вы планируете публиковать приложение в Google Play Store, вам потребуется собрать Android App Bundle (AAB) вместо APK. Команда для этого: `./gradlew bundleRelease`. Процесс подписи аналогичен.
*   **EAS Build**: Для проектов Expo, EAS Build остается предпочтительным и более простым способом сборки и подписи приложений, так как он автоматизирует многие из этих шагов. Этот локальный метод полезен, когда возникают проблемы с EAS или требуется специфичный контроль.

Теперь у вас должен быть подписанный APK для вашего тестового проекта!
