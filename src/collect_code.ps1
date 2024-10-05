# Get the current directory path
$directoryPath = Get-Location

# Log the current directory
Write-Host "Current directory is: $directoryPath"

# Define the output file
$outputFile = "$directoryPath\codeforgpt.txt"

# Log the location of the output file
Write-Host "Output file will be saved at: $outputFile"

# Clear the output file if it exists, or create a new one
Clear-Content -Path $outputFile -ErrorAction SilentlyContinue

# Exclude specific files (package-lock.json, .env)
$excludeFiles = @("package-lock.json", ".env")

# Process code files in the current directory (no recursion)
Get-ChildItem -Path $directoryPath -File | Where-Object {
    $_.Extension -in @(".js", ".html", ".py", ".css") -or $_.Name -in @("package.json", "devcontainer.json") -and 
    $_.Name -notin $excludeFiles
} | ForEach-Object {
    Add-Content -Path $outputFile -Value "===== File: $($_.FullName) ====="
    Get-Content -Path $_.FullName | Add-Content -Path $outputFile
    Add-Content -Path $outputFile -Value "`n==============================`n"
}

# Define the folders to search recursively (public, src, components, .vscode, .github)
$folders = @("public", "src", "components", ".vscode", ".github")

# Recursively process files in the specified subfolders
foreach ($folder in $folders) {
    $folderPath = Join-Path $directoryPath $folder
    if (Test-Path $folderPath) {
        Write-Host "Processing files in folder: $folder"
        
        Get-ChildItem -Path $folderPath -Recurse -File | Where-Object {
            $_.Extension -in @(".js", ".html", ".py", ".yml", ".css") -or $_.Name -in @("package.json", "devcontainer.json") -and 
            $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*build*"
        } | ForEach-Object {
            Add-Content -Path $outputFile -Value "===== File: $($_.FullName) ====="
            Get-Content -Path $_.FullName | Add-Content -Path $outputFile
            Add-Content -Path $outputFile -Value "`n==============================`n"
        }
    }
    else {
        Write-Host "Folder $folder does not exist."
    }
}

# Log completion
Write-Host "Script completed. All content has been saved to: $outputFile"
