# "World's tallest turbine (365 m)" — English Short narration (per beat). Same meaning/order as the Turkish version
# (ajans/cikti/plan-365-metre-2026-10-29.md, PANO #19). Numbers spelled out for TTS (K-005); K-044: US English.
# Sources: Electrek 2026-10-02, Wikipedia (Schipkau GICON), site turbinler/vestas/v126 (:72, :74), rehber:303 (safety rule).
BEAT = [
 ("hook",    ["The world's tallest wind turbine is three hundred sixty-five meters tall. If its generator failed up there, how would you get it down?"], 1.0),
 ("place",   ["Schipkau, Germany. Hub height, three hundred meters. Blade tip, three hundred sixty-five. Taller than the Eiffel Tower."], 1.0),
 ("rotor",   ["Here's what caught my eye: the rotor is one hundred twenty-six meters across. Same as the Vestas V one twenty-six I service. But its hub sits between eighty-seven and one hundred sixty-six meters, depending on version."], 1.0),
 ("why",     ["Why so tall? Winds higher up are stronger and more consistent. The developer expects about twice the energy of a turbine with the same rotor. That's still a projection."], 1.0),
 ("crane",   ["My first question as a technician is different: maintenance. No crane today can lift the nacelle that high."], 1.0),
 ("fix",     ["The fix: a telescoping tower. The inner tower slides down inside the lattice. The crane reaches the machine. Then the tower goes back up."], 1.0),
 ("rule",    ["The tower changes. The rule doesn't: never climb a tower alone. Always at least two."], 1.0),
 ("cta",     ["Full V one twenty-six specs at Soner Soylu dot com. The Turbine Tech. Follow for the next question."], 1.0),
]
# spoken → on-screen (captions/SRT); EN_OZEL: on-screen token → number of spoken words it covers
GOSTER_EN = {
 BEAT[0][1][0]: "The world's tallest wind turbine is 365 meters tall. If its generator failed up there, how would you get it down?",
 BEAT[1][1][0]: "Schipkau, Germany. Hub height, 300 meters. Blade tip, 365. Taller than the Eiffel Tower.",
 BEAT[2][1][0]: "Here's what caught my eye: the rotor is 126 meters across. Same as the Vestas V126 I service. But its hub sits between 87 and 166 meters, depending on version.",
 BEAT[7][1][0]: "Full V126 specs at sonersoylu.com/en. The Turbine Tech. Follow for the next question.",
}
EN_OZEL = {"365": 3, "300": 2, "126": 3, "V126": 3, "87": 1, "166": 3, "sonersoylu.com/en": 4}
