# Generate display variants without modifying originals. Run from any directory.
Add-Type -AssemblyName System.Drawing
$project = Split-Path $PSScriptRoot -Parent
$encoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
$parameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
$parameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]82)
$summary = @()
$variants = @{}
try {
    foreach ($group in @('destinations', 'categories')) {
        $sourceFolder = Join-Path $project "assets/images/$group"
        $outputFolder = Join-Path $project "assets/images/optimized/$group"
        [System.IO.Directory]::CreateDirectory($outputFolder) | Out-Null
        foreach ($file in Get-ChildItem -LiteralPath $sourceFolder -Filter '*.jpg') {
            $sourceKey = "assets/images/$group/" + $file.Name
            $variants[$sourceKey] = @()
            $source = [System.Drawing.Image]::FromFile($file.FullName)
            try {
                $widths = if ($group -eq 'destinations') { @(480, 960, 1600) } else { @(480, 960) }
                foreach ($width in $widths) {
                    $scale = [Math]::Min([double]1, [double]$width / $source.Width)
                    $bitmap = New-Object System.Drawing.Bitmap([int][Math]::Max(1,[Math]::Round($source.Width*$scale)), [int][Math]::Max(1,[Math]::Round($source.Height*$scale)))
                    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
                    try {
                        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                        $graphics.DrawImage($source, 0, 0, $bitmap.Width, $bitmap.Height)
                        $target = Join-Path $outputFolder ($file.BaseName + '-' + $width + '.jpg')
                        $bitmap.Save($target, $encoder, $parameters)
                        $variants[$sourceKey] += @{ src="assets/images/optimized/$group/$($file.BaseName)-$width.jpg"; width=$bitmap.Width }
                        $summary += [pscustomobject]@{ File=$file.Name; Width=$width; OriginalBytes=$file.Length; OptimizedBytes=(Get-Item -LiteralPath $target).Length }
                    } finally { $graphics.Dispose(); $bitmap.Dispose() }
                }
            } finally { $source.Dispose() }
        }
    }
    $source = [System.Drawing.Image]::FromFile((Join-Path $project 'src/assets/Logo.png'))
    $bitmap = New-Object System.Drawing.Bitmap(120,120)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $scale = [Math]::Min(120 / $source.Width, 120 / $source.Height)
        $width = [int][Math]::Round($source.Width * $scale)
        $height = [int][Math]::Round($source.Height * $scale)
        $graphics.DrawImage($source, [int]((120-$width)/2), [int]((120-$height)/2), $width, $height)
        $bitmap.Save((Join-Path $project 'assets/images/optimized/logo.png'), [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $bitmap.Dispose(); $source.Dispose() }
    $summary | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $project 'assets/images/optimized/sizes.json') -Encoding UTF8
    ('"use strict";' + [Environment]::NewLine + 'const LOCAL_IMAGE_VARIANTS = ' + ($variants | ConvertTo-Json -Depth 5) + ';') | Set-Content -LiteralPath (Join-Path $project 'src/config/image-variants.js') -Encoding UTF8
    $summary | Where-Object Width -eq 480 | Format-Table -AutoSize
} finally { $parameters.Dispose() }
