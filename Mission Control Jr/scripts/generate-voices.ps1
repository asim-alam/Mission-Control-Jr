$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$projectDirectory = Split-Path -Parent $PSScriptRoot
$audioDirectory = Join-Path $projectDirectory 'assets/audio'
New-Item -ItemType Directory -Path $audioDirectory -Force | Out-Null
$dialogue = Get-Content -Raw -LiteralPath (Join-Path $projectDirectory 'dialogue-lines.json') | ConvertFrom-Json
$synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  foreach ($entry in $dialogue.PSObject.Properties) {
    $clipName = $entry.Name
    if ($clipName -notmatch '^[a-z-]+$') { throw 'Invalid voice clip name.' }
    $voiceName = if ($entry.Value.voice -eq 'zira') { 'Microsoft Zira Desktop' } else { 'Microsoft David Desktop' }
    $synthesizer.SelectVoice($voiceName)
    $synthesizer.Rate = -1
    $wavePath = Join-Path $audioDirectory ($clipName + '.wav')
    $oggPath = Join-Path $audioDirectory ($clipName + '.ogg')
    $synthesizer.SetOutputToWaveFile($wavePath)
    $synthesizer.Speak($entry.Value.text)
    $synthesizer.SetOutputToNull()
    & ffmpeg -hide_banner -loglevel error -y -i $wavePath -c:a libvorbis -q:a 3 $oggPath
    if ($LASTEXITCODE -ne 0) { throw 'Voice compression failed.' }
    Remove-Item -LiteralPath $wavePath
    Write-Output ('Generated voice: ' + $clipName)
  }
} finally { $synthesizer.Dispose() }
