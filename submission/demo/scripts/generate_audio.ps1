Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice("Microsoft David Desktop")
$synth.Rate = 0 # Normal, authoritative pacing
$synth.Volume = 100

$baseDir = "\\wsl.localhost\Ubuntu\home\devcontainers\Projects\Active\Switch-Hacka\submission\demo\VIDEO_ASSETS"

$scripts = @{
    "scene01" = "Production incidents don't wait. Engineering teams shouldn't have to either. When mission-critical systems fail at three in the morning, minutes cost millions. Introducing the DevOps AI Command Center, built by Team DAANAV for the Flip the Switch Hackathon 2026. A unified collaborative workflow uniting human site reliability engineers and autonomous AI agents to resolve production emergencies with speed, rigor, and safety."
    "scene02" = "Here is the reality today: a critical checkout service begins dropping transactions with HTTP 500 errors. What follows is chaos. PagerDuty wakes on-call engineers. Alerts flood multiple channels. Developers manually SSH into clusters, sifting through gigabytes of logs to isolate stack traces. Untested hotfixes are written under immense stress. Fragmented tools, alert fatigue, and manual handoffs delay resolution for hours, risking costly outages and unintended regressions."
    "scene03" = "Enter the DevOps AI Command Center. Built with React 19, Express 5, and Socket.IO, this dark-mode obsidian cockpit provides a single pane of glass for real-time site reliability. We immediately see our key telemetry: mean time to remediation slashed to forty-two seconds, a one hundred percent automated test pass rate, and real-time health across our microservices. In the incident queue, incident INC-2847 is flagged: a critical payment failure on the checkout API. Everything is tracked live."
    "scene04" = "At the core of our platform is the Switch Agent Protocol. Notice the live Switch connection badge: Switch provides the persistent operational room and structured messaging backbone that unites our agent squad. Instead of a single monolithic language model prone to hallucinations, our architecture enforces strict separation of concerns across four autonomous specialists: Incident Manager handles triage, Log Analyzer isolates anomalies, Code Fixer writes syntax-verified patches, and Testing Agent guarantees regression prevention."
    "scene05" = "Now, let's step into our Telegram War Room, where on-call engineers actually collaborate. The operator sends: Checkout API is returning HTTP 500 errors. Investigate INC-2847. Watch the multi-bot squad communicate sequentially in the group. First, Incident Manager establishes the blast radius at twelve and a half percent. Second, Log Analyzer mines distributed logs and pinpoints the exact culprit stack trace in checkout.ts. Third, Code Fixer posts a synthesized unified git diff directly into the war room. Fourth, Testing Agent boots a sandbox, runs our regression suite, and reports zero regressions. Finally, it surfaces interactive action buttons: human engineers never have to leave chat to inspect the fix."
    "scene06" = "In the Command Center's Code Review panel, engineers inspect the exact code changes. Our Unified Diff Viewer renders color-coded additions and deletions with syntax clarity. Rather than generating reckless full-file rewrites, Code Fixer performs precision surgery: it introduces defensive optional chaining and a fallback cart generator to eliminate the null pointer dereference while preserving business logic. Every line is inspectable, auditable, and traceable."
    "scene07" = "We never ask a human to review untested code. Before presenting the patch, Testing Agent spun up an isolated sandbox and executed our regression suite against the patched code. Both test assertions passed in under five hundred milliseconds with zero regressions. Across our entire monorepo, twenty-eight automated unit, integration, and adapter tests pass cleanly. Proof of correctness is guaranteed before any human sign-off."
    "scene08" = "Now comes our core engineering principle: absolute Human-in-the-Loop Safety. Even with flawless test results, the system is strictly prohibited from merging autonomously. The human operator reviews the patch and clicks Approve and Deploy. Instantly, the cryptographic operator signature is bound to the incident audit trail, the status transitions to RESOLVED, and the resolution notification broadcasts across both channels. Humans retain ultimate authority over consequential production changes."
    "scene09" = "Under the hood, the DevOps AI Command Center is architected for enterprise production: React 19 frontend, Express 5 backend with Socket.IO, PostgreSQL Prisma persistence, and a fail-closed Switch Agent Protocol adapter. Switch provides the shared room and unified messaging backbone that coordinates our multi-agent squad, turning chaotic three A M outages into deterministic, audited, collaborative business workflows."
    "scene10" = "One incident. One coordinated team. Humans and AI working together seamlessly. The DevOps AI Command Center. Built by Team DAANAV for the Flip the Switch Hackathon 2026. Thank you."
}

foreach ($key in ($scripts.Keys | Sort-Object)) {
    $outPath = Join-Path $baseDir "narration_$key.wav"
    Write-Host "Synthesizing narration for $key -> $outPath"
    $synth.SetOutputToWaveFile($outPath)
    $synth.Speak($scripts[$key])
    $synth.SetOutputToNull()
    Write-Host "Done: $outPath"
}
Write-Host "All voiceovers successfully synthesized!"

