# PowerShell script for Windows production
param(
    [Parameter(Position=0)]
    [ValidateSet('start', 'stop', 'build', 'logs', 'shell', 'clean')]
    [string]$Command = 'start'
)

$ComposeFile = "docker-compose.yml"

# Check for .env file
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Copy .env.example to .env and configure it first." -ForegroundColor Yellow
    exit 1
}

switch ($Command) {
    'start' {
        Write-Host "Starting ARTAS production environment..." -ForegroundColor Green
        docker-compose -f $ComposeFile up -d --build
        Write-Host ""
        Write-Host "ARTAS is running at http://localhost" -ForegroundColor Green
    }
    'stop' {
        Write-Host "Stopping ARTAS production environment..." -ForegroundColor Yellow
        docker-compose -f $ComposeFile down
    }
    'build' {
        Write-Host "Building ARTAS production containers..." -ForegroundColor Cyan
        docker-compose -f $ComposeFile build
    }
    'logs' {
        Write-Host "Showing ARTAS logs..." -ForegroundColor Cyan
        docker-compose -f $ComposeFile logs -f
    }
    'shell' {
        Write-Host "Opening shell in backend container..." -ForegroundColor Cyan
        docker-compose -f $ComposeFile exec backend sh
    }
    'clean' {
        Write-Host "WARNING: This will remove all containers, volumes, and images!" -ForegroundColor Red
        $confirm = Read-Host "Are you sure? (yes/no)"
        if ($confirm -eq 'yes') {
            docker-compose -f $ComposeFile down -v --rmi all
            docker system prune -f
        }
    }
}
