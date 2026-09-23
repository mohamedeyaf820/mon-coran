$ErrorActionPreference = "Stop"
$file = "D:\mon-coran-main\mon-coran-main\src\styles\tailwind.css"

Write-Host "Reading file..."
$content = [System.IO.File]::ReadAllText($file, [System.Text.Encoding]::UTF8)
$originalLength = $content.Length
Write-Host "File size: $originalLength bytes"

# Split into lines
$lines = $content -split '\r?\n'

# State machine for processing CSS
$STATE_NORMAL            = 0
$STATE_COMMENT           = 1  # inside /* ... */
$STATE_SCROLLBAR_SEL     = 2  # found ::-webkit-scrollbar, waiting for {
$STATE_SCROLLBAR_BODY    = 3  # inside the ::-webkit-scrollbar rule body

$state = $STATE_NORMAL
$braceDepth = 0
$outputLines = [System.Collections.ArrayList]::new()

for ($i = 0; $i -lt $lines.Count; $i++) {
    $rawLine = $lines[$i]
    
    # ── STATE: inside scrollbar body ──
    if ($state -eq $STATE_SCROLLBAR_BODY) {
        for ($j = 0; $j -lt $rawLine.Length; $j++) {
            $ch = $rawLine[$j]
            if ($ch -eq '{') { $braceDepth++ }
            elseif ($ch -eq '}') { $braceDepth-- }
        }
        if ($braceDepth -le 0) {
            $state = $STATE_NORMAL
            $braceDepth = 0
        }
        continue
    }
    
    # ── STATE: reading scrollbar selector (waiting for {) ──
    if ($state -eq $STATE_SCROLLBAR_SEL) {
        if ($rawLine -match '\{') {
            $state = $STATE_SCROLLBAR_BODY
            $braceDepth = 0
            for ($j = 0; $j -lt $rawLine.Length; $j++) {
                $ch = $rawLine[$j]
                if ($ch -eq '{') { $braceDepth++ }
                elseif ($ch -eq '}') { $braceDepth-- }
            }
            if ($braceDepth -le 0) {
                $state = $STATE_NORMAL
                $braceDepth = 0
            }
        }
        # (if no { on line, stay in SCROLLBAR_SEL - still consuming the selector)
        continue
    }
    
    # ── STATE: inside comment ──
    if ($state -eq $STATE_COMMENT) {
        $null = $outputLines.Add($rawLine)
        if ($rawLine -match '\*/') {
            $state = $STATE_NORMAL
        }
        continue
    }
    
    # ── STATE: NORMAL ──
    # Check if this line enters a multi-line comment
    $hasCommentStart = $rawLine -match '/\*'
    $hasCommentEnd   = $rawLine -match '\*/'
    
    if ($hasCommentStart -and -not $hasCommentEnd) {
        # Multi-line comment starts here
        $null = $outputLines.Add($rawLine)
        $state = $STATE_COMMENT
        continue
    }
    
    # Build a version of the line with single-line comments stripped for checking
    $checkLine = $rawLine
    # Remove single-line /* ... */ comments
    while ($checkLine -match '/\*[^*]*\*+(?:[^/*][^*]*\*+)*/') {
        $checkLine = $checkLine -replace '/\*[^*]*\*+(?:[^/*][^*]*\*+)*/', ' '
    }
    
    # Does this line contain ::-webkit-scrollbar outside of comments?
    if ($checkLine -match '::-webkit-scrollbar') {
        # Start tracking the scrollbar rule
        if ($rawLine -match '\{') {
            # Has opening brace - check if single-line
            $braceDepth = 0
            for ($j = 0; $j -lt $rawLine.Length; $j++) {
                $ch = $rawLine[$j]
                if ($ch -eq '{') { $braceDepth++ }
                elseif ($ch -eq '}') { $braceDepth-- }
            }
            if ($braceDepth -le 0) {
                # Single-line rule - skip it
                continue
            } else {
                $state = $STATE_SCROLLBAR_BODY
                continue
            }
        }
        # Multi-line selector - start consuming
        $state = $STATE_SCROLLBAR_SEL
        continue
    }
    
    # Normal line
    $null = $outputLines.Add($rawLine)
}

# ── Clean up blank lines ──
$deduped = [System.Collections.ArrayList]::new()
$blankSeq = 0
for ($i = 0; $i -lt $outputLines.Count; $i++) {
    $line = $outputLines[$i]
    if ($line.Trim() -eq '') {
        $blankSeq++
        if ($blankSeq -le 2) {
            $null = $deduped.Add($line)
        }
    } else {
        $blankSeq = 0
        $null = $deduped.Add($line)
    }
}

# Reconstruct
$content = ($deduped -join "`r`n")

# ── Insert new global scrollbar right after :root closing brace ──
$newGlobalScrollbar = @'

/* ── Global Scrollbar ──────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
::-webkit-scrollbar-corner { background: transparent; }

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}
'@

# The marker: end of :root is the closing } after --tajwid-idgham-warsh
$markerPattern = '(--tajwid-idgham-warsh:\s*#44dd66;[^\r\n]*\r?\n\})'
if ($content -match $markerPattern) {
    Write-Host "Found :root end, inserting global scrollbar..."
    $content = $content -replace '(--tajwid-idgham-warsh:\s*#44dd66;[^\r\n]*\r?\n\})', ("`$1`r`n" + $newGlobalScrollbar)
} else {
    Write-Host "WARNING: :root end marker not found. Inserting after @import instead."
    $content = $content -replace '(@import "tailwindcss";\s*\r?\n)', ("`$1`r`n" + $newGlobalScrollbar + "`r`n")
}

# ── Clean up orphaned "scrollbar" comment headers ──
$content = $content -replace '\r?\n/\* Scrollbar polish \*/\r?\n', "`r`n"
$content = $content -replace '\r?\n/\* .*Scrollbar .*\*/\r?\n', "`r`n"
$content = $content -replace '\r?\n/\* NOTE: There are.*?\*/\r?\n', "`r`n"

# Remove excess blank lines (3+ -> 2)
$content = $content -replace '(\r?\n){3,}', "`r`n`r`n"

# ── Write back ──
[System.IO.File]::WriteAllText($file, $content, [System.Text.Encoding]::UTF8)
$newLength = $content.Length
$removed = $originalLength - $newLength
Write-Host "Done. Original: $originalLength bytes, New: $newLength bytes, Removed: $removed bytes"
