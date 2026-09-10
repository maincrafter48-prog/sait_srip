-- Crash Reporter для PCStats
-- Этот файл создаётся автоматически при краше скрипта

local crashInfo = {
    error = "%ERROR_MSG%",
    traceback = "%TRACEBACK%",
    timestamp = os.date("%Y-%m-%d %H:%M:%S"),
    scriptVersion = "1.7.5"
}

-- Сохраняем лог краша
local logFile = io.open("moonloader/PCStats_crash_log.txt", "a")
if logFile then
    logFile:write("\n=== CRASH REPORT [" .. crashInfo.timestamp .. "] ===\n")
    logFile:write("Error: " .. tostring(crashInfo.error) .. "\n")
    logFile:write("Traceback:\n" .. tostring(crashInfo.traceback) .. "\n")
    logFile:write("============================================\n")
    logFile:close()
end

-- Показываем меню с информацией об ошибке
local imgui = require('mimgui')
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
    
    -- Регистрируем отрисовку меню
    local function onFrame()
        if showCrashMenu and imgui then
            pcall(drawCrashMenu)
        end
    end
    
    sampRegisterEvent("onFrame", true, onFrame)
end
