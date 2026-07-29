@echo off
set "FUSHI_ELECTRON_ISOLATED=1"
set "FUSHI_TV_LITE=1"
start "RPG FUSHI TV Jogador" "%~dp0RPG FUSHI.exe" --fushi-profile=player1 --fushi-secondary-instance --fushi-route=/multiplayer --fushi-quality=low --fushi-tv-lite
