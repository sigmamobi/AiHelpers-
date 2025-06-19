# Краткая инструкция по установке JDK на macOS

Это руководство поможет вам быстро установить Java Development Kit (JDK) на macOS, необходимый для сборки Android-приложений.

## Шаг 1: Установка Homebrew (если еще не установлен)

Homebrew — это менеджер пакетов для macOS.

1.  Откройте Терминал.
2.  Выполните команду:
    ```bash
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    ```
    Следуйте инструкциям на экране.

## Шаг 2: Установка OpenJDK через Homebrew

Мы установим OpenJDK 17, так как это LTS-версия и хорошо подходит для Android-разработки.

1.  Обновите Homebrew (хорошая практика):
    ```bash
    brew update
    ```
2.  Установите OpenJDK 17:
    ```bash
    brew install openjdk@17
    ```

## Шаг 3: Настройка переменных окружения

После установки JDK нужно указать системе, где он находится.

1.  **Добавьте JDK в PATH**:
    *   Для Apple Silicon (M1/M2/M3 и новее):
        ```bash
        echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
        ```
    *   Для Intel Mac:
        ```bash
        echo 'export PATH="/usr/local/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
        ```

2.  **Установите `JAVA_HOME`**:
    *   Для Apple Silicon:
        ```bash
        echo 'export JAVA_HOME=$(/usr/libexec/java_home -v17)' >> ~/.zshrc
        ```
    *   Для Intel Mac (путь может немного отличаться, проверьте вывод `/usr/libexec/java_home -v17`):
        ```bash
        echo 'export JAVA_HOME=/Library/Java/JavaVirtualMachines/openjdk-17.jdk/Contents/Home' >> ~/.zshrc 
        ```

3.  **Примените изменения**:
    Закройте и снова откройте Терминал, или выполните:
    ```bash
    source ~/.zshrc
    ```

## Шаг 4: Проверка установки

1.  Откройте новый Терминал.
2.  Проверьте версию Java:
    ```bash
    java -version
    ```
    Вы должны увидеть что-то вроде `openjdk version "17.x.x" ...`.
3.  Проверьте `JAVA_HOME`:
    ```bash
    echo $JAVA_HOME
    ```
    Должен отобразиться путь к вашему JDK.

## Шаг 5: Настройка ANDROID_HOME (если еще не настроено)

Эта переменная указывает на местоположение вашего Android SDK. Android Studio обычно устанавливает SDK в `~/Library/Android/sdk`.

1.  **Добавьте `ANDROID_HOME` в ваш `~/.zshrc` (или `~/.bash_profile`)**:
    ```bash
    echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
    echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
    echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc 
    ```
    *Примечание: Пути к `tools` и `build-tools` обычно добавляются Android Studio или Gradle автоматически, но `platform-tools` (для adb) и `emulator` полезно иметь в PATH.*

2.  **Примените изменения**:
    ```bash
    source ~/.zshrc
    ```
3.  **Проверьте**:
    ```bash
    echo $ANDROID_HOME
    adb version 
    ```
    Первая команда должна показать путь к SDK, вторая — версию Android Debug Bridge.

После выполнения этих шагов ваша система будет готова к локальной сборке Android-приложений.
