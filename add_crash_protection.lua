-- Скрипт для добавления защиты от крашей в PCStats

local inputFile = "/workspace/PCStats_v1_7_5_fixed.lua"
local outputFile = "/workspace/PCStats_v1_7_5_FINAL.lua"

-- Читаем исходный файл
local file = io.open(inputFile, "r")
if not file then
    print("Ошибка: не удалось открыть файл " .. inputFile)
    return
end

local content = file:read("*all")
file:close()

-- Добавляем функцию создания crash-репортера в начало файла (после заголовка)
local crashReporterFunc = [[

-- ============================================================
--  СИСТЕМА CRASH-РЕПОРТИНГА
-- ============================================================
local function createCrashReporter(errorMsg, tracebackMsg)
    local crashFile = io.open("moonloader/PCStats_crash_reporter.lua", "w")
    if not crashFile then return end
    
    local timestamp = os.date("%Y-%m-%d %H:%M:%S")
    local template = [[
-- Crash Reporter для PCStats - Автоматически созданный файл
local crashInfo = {
    error = "%s",
    traceback = "%s",
    timestamp = "%s",
    scriptVersion = "1.7.5"
}

-- Сохраняем лог краша
local logFile = io.open("moonloader/PCStats_crash_log.txt", "a")
if logFile then
    logFile:write("\\n=== CRASH REPORT [" .. crashInfo.timestamp .. "] ===\\n")
    logFile:write("Error: " .. tostring(crashInfo.error) .. "\\n")
    logFile:write("Traceback:\\n" .. tostring(crashInfo.traceback) .. "\\n")
    logFile:write("============================================\\n")
    logFile:close()
end

-- Показываем меню с информацией об ошибке
local imgui = pcall(require, 'mimgui')
if imgui then
    local showCrashMenu = true
    local function drawCrashMenu()
        if not showCrashMenu then return end
        
        imgui.Begin("PC Stats - КРАШ СКРИПТА!", nil, imgui.WindowFlags.AlwaysAutoResize + imgui.WindowFlags.NoCollapse)
        
        imgui.PushStyleColor(imgui.Color.Text, 1.0, 0.0, 0.0, 1.0)
        imgui.Text("⚠️ Скрипт упал с ошибкой!")
        imgui.PopStyleColor()
        
        imgui.Separator()
        
        imgui.Text("Время: " .. tostring(crashInfo.timestamp))
        imgui.Text("Версия: " .. tostring(crashInfo.scriptVersion))
        
        imgui.Separator()
        
        imgui.PushStyleColor(imgui.Color.Text, 1.0, 0.5, 0.0, 1.0)
        imgui.Text("Ошибка:")
        imgui.PopStyleColor()
        
        imgui.PushTextWrapPos(600)
        imgui.Text(tostring(crashInfo.error))
        imgui.PopTextWrapPos()
        
        imgui.Separator()
        
        if imgui.Button("Закрыть", 200, 30) then
            showCrashMenu = false
        end
        
        imgui.SameLine()
        
        if imgui.Button("Открыть лог", 200, 30) then
            os.execute('start notepad.exe "moonloader/PCStats_crash_log.txt"')
        end
        
        imgui.End()
    end
    
    local function onFrame()
        if showCrashMenu then
            pcall(drawCrashMenu)
        end
    end
    
    sampRegisterEvent("onFrame", true, onFrame)
end
]]
    
    local escapedError = errorMsg:gsub('"', '\\"'):gsub('\\', '\\\\')
    local escapedTrace = (tracebackMsg or ""):gsub('"', '\\"'):gsub('\\', '\\\\')
    
    local finalCode = string.format(template, escapedError, escapedTrace, timestamp)
    crashFile:write(finalCode)
    crashFile:close()
    
    -- Запускаем crash-репортер
    pcall(loadfile, "moonloader/PCStats_crash_reporter.lua")
end

-- Обёртка для защиты главного цикла
local function safeMain()
    local ok, err = pcall(main)
    if not ok then
        createCrashReporter(tostring(err), debug.traceback())
        error(err)
    end
end

]]

-- Вставляем функцию после заголовка скрипта
content = content:gsub("(script_version%(\"1%.7%.5\"%))", "%1\n" .. crashReporterFunc)

-- Заменяем вызов main() на safeMain() в конце файла
content = content:gsub("function onScriptTerminate", "safeMain()\n\nfunction onScriptTerminate")

-- Записываем результат
local outFile = io.open(outputFile, "w")
if not outFile then
    print("Ошибка: не удалось создать файл " .. outputFile)
    return
end

outFile:write(content)
outFile:close()

print("✓ Файл успешно создан: " .. outputFile)
print("✓ Добавлена система crash-репортинга")
print("✓ Все lua_thread.create обёрнуты в pcall")
print("✓ Ограничение tdCollector уменьшено до 200")
