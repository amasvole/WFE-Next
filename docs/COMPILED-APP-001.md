# COMPILED-APP-001

Baseline: 5d6d3ae323654fad3eefc3f75f5fc8c266a8b7a5.

## Environment
Existing toolchains included JDK/javac 21, Maven 3.9.14, .NET SDK 10.0.401, LLVM/MinGW gcc/g++, Python 3.12/Tk and Node 24/npm. No pywinauto/uiautomation package was installed. Windows UI Automation was already available through the OS UIAutomationClient/UIAutomationTypes assemblies and successfully enumerated real desktop windows before product planning.

## Plan and model architecture
Given the Goal plus discovered environment, Claude selected .NET 10 C# WinForms, stock native controls, System.Text.Json persistence to entries.json, dotnet build -c Release and direct launch of the resulting MaterialTracker.exe. WFE did not prescribe language, framework, persistence or build system.

The artifact-owned wfe-run.json declares argv build/start, artifact path, process-window readiness and process-tree stop. wfe-desktop.json proposes bounded semantic UI steps. WFE independently executes those steps using Windows UI Automation.

## Build
Independent WFE build: dotnet build MaterialTracker/MaterialTracker.csproj -c Release. Result: 0 warnings, 0 errors, exit 0. Artifact MaterialTracker/bin/Release/net10.0-windows/MaterialTracker.exe existed at 162304 bytes.

## Independent desktop acceptance
WFE observed a native window named 3D Print Material Tracker and semantic controls by AutomationId. ValuePattern/InvokePattern/Grid DataItem ValuePattern were used; no OCR or coordinate clicks.

Initial product acceptance proved PLA / 125 / COMPILED-FIRST and PETG / 75 / COMPILED-PERSIST, total 200. Old PID 363756 was stopped; new PID 130244 reloaded the same two entries and total 200; cleanup passed.

The final generic kernel-integrated run appended PC / 5 / KERNEL-DESKTOP-A and NYLON / 10 / KERNEL-DESKTOP-PERSIST. UIA observed total 360 then 370. PID 243504 was stopped, PID 360548 restarted, both new entries and total 370 were observed after restart, then PID 360548 was stopped.

## Repair
One real product acceptance failure occurred: the visible total was a WinForms Label whose numeric text was not exposed through a standard UIA ValuePattern. WFE supplied concrete evidence. Claude repaired in place by changing only that display to a read-only borderless TextBox, preserving visual behavior and architecture. Rebuild passed with 0 warnings/errors. UIA then independently observed Total grams used: 200 and later 370.

## False-test handling
Procedure failures were not repaired as product defects: provider could not read a Plan outside its sandbox, a PowerShell parameter collided with built-in $PID, a harness had a parser error, empty Start-Process ArgumentList was invalid, and an acceptance run expected a clean total despite deliberately preserved prior data. Each was corrected in the procedure/executor without product changes. Final cleanup also detected one orphan from an earlier failed harness attempt (PID 130168); it was explicitly terminated, after which no MaterialTracker process remained. The accepted generic executor itself had already stopped both of its owned PIDs.

## Generalization
Existing workspace/run/provider repair/verifier concepts generalized. The genuinely narrow abstraction was the browser-only operational/acceptance contract. It was extended minimally: optional build+artifact, process-window readiness, and a bounded Windows UIA semantic executor. The kernel contains no WinForms/.NET/material-specific execution path.