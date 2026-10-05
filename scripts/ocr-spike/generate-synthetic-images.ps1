$ErrorActionPreference="Stop"
Add-Type -AssemblyName System.Drawing
$out=Join-Path $PSScriptRoot "synthetic-images"
New-Item -ItemType Directory -Force -Path $out|Out-Null
function Save-Card($name,$lines,[float]$angle=0,[bool]$low=$false){
 $w=1400;$h=850;$bmp=New-Object Drawing.Bitmap $w,$h
 $g=[Drawing.Graphics]::FromImage($bmp);$g.Clear($(if($low){[Drawing.Color]::Gainsboro}else{[Drawing.Color]::White}))
 $brush=New-Object Drawing.SolidBrush ($(if($low){[Drawing.Color]::Gray}else{[Drawing.Color]::Black}))
 $font=New-Object Drawing.Font("Consolas",34,[Drawing.FontStyle]::Regular,[Drawing.GraphicsUnit]::Pixel)
 if($angle -ne 0){$g.TranslateTransform($w/2,$h/2);$g.RotateTransform($angle);$g.TranslateTransform(-$w/2,-$h/2)}
 $y=100;foreach($line in $lines){$g.DrawString($line,$font,$brush,80,$y);$y+=75}
 $path=Join-Path $out "$name.png";$bmp.Save($path,[Drawing.Imaging.ImageFormat]::Png)
 $font.Dispose();$brush.Dispose();$g.Dispose();$bmp.Dispose();return $path
}
$mrz=@("SYNTHETIC PASSPORT - NOT A REAL DOCUMENT","SURNAME: ERIKSSON","GIVEN: ANNA MARIA","P<UTOERIKSSON<<ANNA<MARIA<<<<<<<<<<<<<<<<<<<","L898902C36UTO7408122F1204159ZE184226B<<<<<10")
$id=@("SYNTHETIC ID CARD - NOT A REAL DOCUMENT","SURNAME: ROSSI","GIVEN NAME: MARIO","DATE OF BIRTH: 1990-04-12","NATIONALITY: ITA","DOCUMENT: CA00000AA","EXPIRY: 2030-04-11")
Save-Card "td3-clean" $mrz
Save-Card "td3-rotated" $mrz 7
Save-Card "td3-low-contrast" $mrz 0 $true
Save-Card "eu-id-clean" $id
Write-Output "SYNTHETIC_IMAGES_CREATED"
Get-ChildItem $out|Select Name,Length
