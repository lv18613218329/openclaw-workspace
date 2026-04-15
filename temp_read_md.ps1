$files = Get-ChildItem "C:\Users\Administrator\.openclaw\workspace\electronic-wpf-whiteboard\*.md"
foreach ($f in $files) {
    Write-Host "===FILE==="
    Write-Host $f.Name
    Write-Host "===CONTENT==="
    $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    Write-Host $content.Substring(0, [Math]::Min(3000, $content.Length))
    Write-Host ""
}