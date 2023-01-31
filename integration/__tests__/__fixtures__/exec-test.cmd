@ECHO OFF
@IF EXIST "%~dp0\node.exe" (
  "%~dp0\node.exe"  "%~dp0\exec-test.js" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%
  node  "%~dp0\exec-test.js" %*
)
