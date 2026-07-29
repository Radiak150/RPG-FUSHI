@echo off
set "FUSHI_ELECTRON_ISOLATED=1"
start "RPG FUSHI Jogador 2" "%~dp0RPG FUSHI.exe" --fushi-profile=player2 --fushi-secondary-instance --fushi-route=/multiplayer --fushi-quality=low
