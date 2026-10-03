# "Wind is blowing, turbine is stopped. Is it broken?" — English Short narration (per beat). Same meaning/order as the
# Turkish version (ajans/cikti/plan-ruzgar-esiyor-2026-10-03.md). Numbers spelled out for TTS (K-005).
# Only figures: 3 m/s (~7 mph), 25 m/s (~56 mph). B4 is plain narration (no quote: /en/ has no matching sentence).
# B5: "opened, locked" was heard as "open, locked" 3/3 → split sentence. CTA: "sonersoylu" read as "sonar solu";
# "Soner Soylu dot com" is closest (CTC: "soner sol lu dat com"); Whisper cannot spell the name.
# CTA does not promise the live-wind page (Turkish only); on-screen address is sonersoylu.com/en.
BEAT = [
 ("hook",     ["The wind is blowing, but the turbine is stopped. Is it broken? Usually, no."], 1.0),
 ("low",      ["If the wind is too weak, there's no power. On this model, for example, the turbine stops below three meters per second, about seven miles per hour."], 1.0),
 ("high",     ["It also stops in very strong wind. Above twenty-five meters per second, about fifty-six miles per hour, the blades are feathered for safety."], 1.0),
 ("curve",    ["At the base of the tower, the answer to why it stopped is usually not a fault. It's one end of this curve."], 1.0),
 ("service",  ["Turbines are also stopped for planned maintenance. The breaker is opened. Then it's locked and tagged. If required, the rotor lock goes in too."], 1.0),
 ("grid",     ["Sometimes the wind and the machine are both ready, but the grid operator sends a curtailment, and the turbine is stopped. This is not a fault. If there's an alarm, it's a different job: read the alarm first."], 1.0),
 ("reverse",  ["It works the other way too: no wind, but the nacelle is turning. Not the rotor. The nacelle on top."], 1.0),
 ("untwist",  ["The power cables inside the tower twist as the nacelle yaws. After a set number of turns, the turbine turns back the other way to untwist them, wind or no wind."], 1.0),
 ("cta",      ["More from the field at Soner Soylu dot com. The Turbine Tech. Follow for the next question."], 1.0),
]
