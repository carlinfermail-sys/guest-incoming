param([Parameter(Mandatory=$true)][string]$Path)
$ErrorActionPreference="Stop"
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null=[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Graphics.Imaging.BitmapDecoder,Windows.Foundation,ContentType=WindowsRuntime]
$null=[Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
function Await($op,[Type]$type){
 $m=[System.WindowsRuntimeSystemExtensions].GetMethods()|?{$_.Name -eq "AsTask" -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1}|select -First 1
 $task=$m.MakeGenericMethod($type).Invoke($null,@($op));$task.Wait();return $task.Result
}
$sw=[Diagnostics.Stopwatch]::StartNew()
$file=Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync((Resolve-Path $Path).Path)) ([Windows.Storage.StorageFile])
$stream=Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$decoder=Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
$bitmap=Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])
$engine=[Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
if(-not $engine){throw "No OCR engine"}
$result=Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])
$sw.Stop()
[pscustomobject]@{File=(Split-Path $Path -Leaf);Milliseconds=$sw.ElapsedMilliseconds;Text=$result.Text}|ConvertTo-Json -Compress
