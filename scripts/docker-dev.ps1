# PowerShell script for Windows development
param(
    [Parameter(Position=0)]
    [ValidateSet('start', 'stop', 'build', 'logs', 'shell', 'migrate', 'superuser', 'clean')]
    [string]$Command = 'start'
)

$ComposeFile = "docker-compose.dev.yml"

switch ($Command) {
    'start' {
        Write-Host "Starting ARTAS development environment..." -ForegroundColor Green
        docker-compose -f $ComposeFile up --build
    }
    'stop' {
        Write-Host "Stopping ARTAS development environment..." -ForegroundColor Yellow
        docker-compose -f $ComposeFile down
    }
    'build' {
        Write-Host "Building ARTAS development containers..." -ForegroundColor Cyan
        docker-compose -f $ComposeFile build
    }
    'logs' {
        Write-Host "Showing ARTAS logs..." -ForegroundColor Cyan
        docker-compose -f $ComposeFile logs -f
    }
    'shell' {
        Write-Host "Opening shell in backend container..." -ForegroundColor Cyan
        docker-compose -f $ComposeFile exec backend bash
    }
    'migrate' {
        Write-Host "Running database migrations..." -ForegroundColor Cyan
        docker-compose -f $ComposeFile exec backend python manage.py migrate
    }
    'superuser' {
        Write-Host "Creating superuser..." -ForegroundColor Cyan
        docker-compose -f $ComposeFile exec backend python manage.py createsuperuser
    }
    'clean' {
        Write-Host "Cleaning up Docker resources..." -ForegroundColor Red
        docker-compose -f $ComposeFile down -v --rmi all
        docker system prune -f
    }
}
