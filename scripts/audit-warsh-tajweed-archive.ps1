param(
  [Parameter(Mandatory = $true)][string]$ArchivePath,
  [string]$OutputPath = '.codex-artifacts/warsh-user-archive-audit.json'
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $ArchivePath))
try {
  $categories = @{}
  $rules = @{}
  $keys = [Collections.Generic.HashSet[string]]::new()
  $errors = [Collections.Generic.List[object]]::new()
  $verses = 0
  $segments = 0
  $supplementaryCharacters = 0
  $surahEntries = @($archive.Entries | Where-Object { $_.FullName -match '^surahs/\d{3}\.json$' } | Sort-Object FullName)
  foreach ($entry in $surahEntries) {
    $reader = [IO.StreamReader]::new($entry.Open())
    try { $surah = $reader.ReadToEnd() | ConvertFrom-Json } finally { $reader.Dispose() }
    if ($surah.verses.Count -ne $surah.verses_count) { $errors.Add(@{ file = $entry.FullName; issue = 'verse-count' }) }
    foreach ($verse in $surah.verses) {
      $verses++
      if (!$keys.Add($verse.verse_key)) { $errors.Add(@{ key = $verse.verse_key; issue = 'duplicate-key' }) }
      if ($verse.verse_key -ne "$($surah.surah_number):$($verse.ayah)") { $errors.Add(@{ key = $verse.verse_key; issue = 'identity' }) }
      $text = [string]$verse.text_ar
      $codepoints = [Collections.Generic.List[string]]::new()
      for ($index = 0; $index -lt $text.Length; $index++) {
        if ([char]::IsHighSurrogate($text[$index]) -and $index + 1 -lt $text.Length -and [char]::IsLowSurrogate($text[$index + 1])) {
          $codepoints.Add($text.Substring($index, 2)); $index++; $supplementaryCharacters++
        } else { $codepoints.Add($text.Substring($index, 1)) }
      }
      $plainHtml = [Net.WebUtility]::HtmlDecode(([string]$verse.text_tajweed_html -replace '<[^>]*>', ''))
      if ($plainHtml -cne $text) { $errors.Add(@{ key = $verse.verse_key; issue = 'html-text-mismatch' }) }
      $previousEnd = 0
      foreach ($segment in $verse.tajweed_segments) {
        $segments++
        $categories[$segment.category] = 1 + $categories[$segment.category]
        foreach ($rule in $segment.rules) { $rules[$rule] = 1 + $rules[$rule] }
        $start = [int]$segment.start; $end = [int]$segment.end
        if ($start -lt $previousEnd -or $end -le $start -or $end -gt $codepoints.Count) {
          $errors.Add(@{ key = $verse.verse_key; issue = 'range'; start = $start; end = $end })
        } else {
          $covered = ($codepoints.GetRange($start, $end - $start) -join '')
          if ($covered -cne [string]$segment.text) { $errors.Add(@{ key = $verse.verse_key; issue = 'segment-text-mismatch' }) }
        }
        $previousEnd = $end
      }
    }
  }
  $result = [ordered]@{
    archiveSha256 = (Get-FileHash -LiteralPath $ArchivePath -Algorithm SHA256).Hash.ToLowerInvariant()
    surahs = $surahEntries.Count; verses = $verses; uniqueVerseKeys = $keys.Count
    segments = $segments; supplementaryCharacters = $supplementaryCharacters
    categories = $categories; engineRules = $rules
    errors = $errors.ToArray()
    sourceStatus = 'CANDIDATE_NOT_ADOPTED'
    numbering = 'Hafs/Kufi (archive declaration); cannot address Warsh Madinah verses directly'
    palettePolicy = 'Map verified individual rules to src/data/tajwidPalette.js; do not copy archive colors'
  }
  $outputFullPath = [IO.Path]::GetFullPath($OutputPath)
  [IO.Directory]::CreateDirectory([IO.Path]::GetDirectoryName($outputFullPath)) | Out-Null
  [IO.File]::WriteAllText($outputFullPath, ($result | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
  Write-Output "Surahs=$($result.surahs) Verses=$verses Segments=$segments Errors=$($errors.Count) Report=$outputFullPath"
} finally { $archive.Dispose() }
