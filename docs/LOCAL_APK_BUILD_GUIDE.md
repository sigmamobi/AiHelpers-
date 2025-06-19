# Локальная сборка Android APK для тестирования

Это руководство поможет вам собрать Android APK (Android Package Kit) для вашего приложения AI Assistant локально. Мы рассмотрим два основных способа: сборку через командную строку с использованием Gradle и сборку через Android Studio. APK, собранный таким образом, предназначен для тестирования и не требует сложной настройки ключей подписи, как для публикации в Google Play Store.

## Предварительные требования

Перед тем как начать, убедитесь, что у вас установлены и настроены следующие инструменты:

1.  **Node.js и npm/yarn**: Необходимы для работы с Expo. (У вас уже установлены)
2.  **Expo CLI**: Глобально установленный Expo CLI. (У вас уже установлен)
3.  **Git**: Для управления версиями.
4.  **Java Development Kit (JDK)**:
    *   **Обязательно для локальной сборки.**
    *   Рекомендуемая версия: OpenJDK 17 (или 11).
    *   Если не установлен, см. **Раздел 1: Установка JDK на macOS**.
5.  **Android Studio и Android SDK**:
    *   **Обязательно для локальной сборки.**
    *   Установите Android Studio с официального сайта. Вместе с ним установится Android SDK.
    *   Убедитесь, что переменная окружения `ANDROID_HOME` (или `ANDROID_SDK_ROOT`) правильно указывает на директорию вашего SDK (обычно `~/Library/Android/sdk` на macOS). См. **Раздел 2: Настройка ANDROID_HOME**.

## Раздел 1: Установка JDK на macOS

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

4.  **(Опционально, но рекомендуется) Укажите `JAVA_HOME`**:
    Некоторые инструменты могут требовать эту переменную.
    *   Для Apple Silicon:
        ```bash
        echo 'export JAVA_HOME=$(/usr/libexec/java_home -v17)' >> ~/.zshrc
        ```
    *   Для Intel Macs (путь может отличаться в зависимости от установки):
        ```bash
        # Сначала найдите точный путь: /usr/libexec/java_home -v17
        # Пример пути: /Library/Java/JavaVirtualMachines/openjdk-17.jdk/Contents/Home
        echo 'export JAVA_HOME=/Library/Java/JavaVirtualMachines/openjdk-17.jdk/Contents/Home' >> ~/.zshrc 
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
echo $JAVA_HOME 
# Должен вывести путь к вашему JDK, например /opt/homebrew/opt/openjdk@17 или аналогичный
```
Вы должны увидеть информацию об установленной версии JDK (например, 17.x.x).

## Раздел 2: Настройка переменной окружения ANDROID_HOME

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
    # Для некоторых конфигураций могут понадобиться tools и tools/bin
    # echo 'export PATH=$PATH:$ANDROID_HOME/tools' >> ~/.zshrc
    # echo 'export PATH=$PATH:$ANDROID_HOME/tools/bin' >> ~/.zshrc
    ```
3.  **Перезапустите Терминал** или выполните `source ~/.zshrc`.
4.  **Проверьте**: `echo $ANDROID_HOME` (должен вывести путь к SDK) и `adb version` (должен показать версию ADB).

## Раздел 3: Генерация нативного Android-проекта

Если в корне вашего Expo-проекта еще нет папки `android`, вам нужно ее сгенерировать. Это переведет ваш проект в Bare Workflow для платформы Android, давая вам доступ к нативным файлам.

1.  **Перейдите в корневую директорию вашего проекта**:
    ```bash
    cd /Users/vyache/factoryai/clean-ai-app/ai-assistant
    ```
2.  **Выполните команду `prebuild`**:
    ```bash
    npx expo prebuild --platform android --clean
    ```
    *   `--platform android`: указывает, что нужно сгенерировать проект только для Android.
    *   `--clean`: удаляет существующую папку `android` (если она есть) перед генерацией, чтобы избежать конфликтов.
    Эта команда создаст папку `android` в вашем проекте, содержащую нативный Android-проект.

## Раздел 4: Сборка APK через Gradle (Командная строка)

Этот метод позволяет собрать APK прямо на вашем компьютере. Мы будем собирать отладочный APK (`debug`), который не требует сложных настроек подписи и подходит для тестирования.

1.  **Убедитесь, что JDK и ANDROID_HOME настроены** (см. Разделы 1 и 2).
2.  **Перейдите в директорию `android`** в вашем проекте:
    ```bash
    cd /Users/vyache/factoryai/clean-ai-app/ai-assistant/android
    ```
3.  **Очистите предыдущие сборки** (рекомендуется перед каждой новой сборкой):
    ```bash
    ./gradlew clean
    ```
    *   Если вы получаете ошибку `Permission denied`, выполните `chmod +x ./gradlew`.

4.  **Соберите Debug APK**:
    ```bash
    ./gradlew assembleDebug
    ```
    Эта команда скомпилирует ваше приложение и создаст `app-debug.apk`. Процесс может занять несколько минут.

5.  **Найдите ваш APK**:
    После успешной сборки APK-файл будет находиться по пути:
    `android/app/build/outputs/apk/debug/app-debug.apk`

## Раздел 5: Сборка APK через Android Studio (Альтернативный вариант)

Если вы предпочитаете графический интерфейс, вы можете использовать Android Studio для сборки APK.

1.  **Убедитесь, что JDK и Android SDK установлены и настроены.**
2.  **Убедитесь, что папка `android` сгенерирована** (см. Раздел 3).
3.  **Откройте Android Studio.**
4.  Выберите **"Open an existing Android Studio project"** (или "Open" в более новых версиях).
5.  Перейдите к папке `android` внутри вашего Expo-проекта (например, `/Users/vyache/factoryai/clean-ai-app/ai-assistant/android`) и откройте ее.
6.  **Дождитесь, пока Android Studio синхронизирует проект с Gradle.** Это может занять некоторое время при первом открытии. Следите за индикатором в нижней части окна.
7.  После успешной синхронизации, в меню выберите **Build** -> **Build Bundle(s) / APK(s)** -> **Build APK(s)**.
    *   Android Studio начнет сборку отладочного APK.
8.  **Найдите ваш APK**:
    *   После завершения сборки, в правом нижнем углу Android Studio появится уведомление со ссылкой "Locate". Нажмите на нее, чтобы открыть папку с APK.
    *   Обычно APK находится по пути: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Раздел 6: Установка APK на Android устройство или эмулятор

1.  **Разрешите установку из неизвестных источников** на вашем Android устройстве:
    *   Перейдите в **Настройки (Settings)**.
    *   Найдите раздел **Безопасность (Security)** или **Приложения (Apps)** → **Специальный доступ приложениям (Special app access)**.
    *   Найдите опцию **Установка неизвестных приложений (Install unknown apps)**.
    *   Выберите ваш браузер или файловый менеджер и разрешите ему установку приложений.
    *   *Путь к этой настройке может немного отличаться в зависимости от версии Android и производителя устройства.*

2.  **Перенесите APK на устройство**:
    *   **USB**: Подключите устройство к компьютеру и скопируйте APK-файл в память устройства.
    *   **Загрузка по ссылке/Email**: Если вы загрузили APK на облако или отправили по email, скачайте его на устройстве.

3.  **Установите APK**:
    *   Откройте файловый менеджер на устройстве, найдите APK-файл и нажмите на него.
    *   Следуйте инструкциям на экране для установки.
    *   Или, если у вас настроен ADB (Android Debug Bridge) и устройство подключено к компьютеру:
    ```bash
    adb install /путь/к/вашему/app-debug.apk 
    ```
    (Замените `/путь/к/вашему/app-debug.apk` на реальный путь к файлу).

4.  **Запустите и протестируйте приложение.**

## Раздел 7: Устранение распространенных проблем

*   **`Unable to locate a Java Runtime` или `JAVA_HOME not set`**:
    *   Убедитесь, что JDK установлен правильно и переменная `JAVA_HOME` указывает на директорию установки JDK. Проверьте `PATH`.
*   **`SDK location not found. Define location with sdk.dir in the local.properties file or with an ANDROID_HOME environment variable.`**:
    *   Убедитесь, что переменная `ANDROID_HOME` (или `ANDROID_SDK_ROOT`) установлена и указывает на корректный путь к Android SDK.
    *   Иногда помогает создание файла `android/local.properties` с содержанием `sdk.dir=/путь/к/вашему/android/sdk` (замените на ваш путь).
*   **Ошибки Gradle Sync в Android Studio**:
    *   Убедитесь, что у вас стабильное интернет-соединение для загрузки зависимостей Gradle.
    *   Попробуйте **File -> Sync Project with Gradle Files**.
    *   Попробуйте **File -> Invalidate Caches / Restart...** -> **Invalidate and Restart**.
*   **Ошибки сборки, связанные с зависимостями**:
    *   Выполните `npm install` или `yarn install` в корне проекта Expo, чтобы убедиться, что все JavaScript зависимости установлены.
    *   Команда `./gradlew clean` перед сборкой может помочь.

Теперь у вас есть все необходимое для локальной сборки и тестирования APK вашего приложения AI Assistant! Если возникнут ошибки, внимательно читайте сообщения в терминале или логи сборки — они обычно содержат ключ к решению проблемы.
