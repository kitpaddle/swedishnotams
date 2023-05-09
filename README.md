# Swedish NOTAMs
A real-time accurate map of official NOTAMs currently in the Swedish FIR.

NOTAMs in the Swedish FIR are currently publishe din text format by the swedish governmental Air Navigation Service Provider (ANSP): LFV
These can be found here: https://www.aro.lfv.se/

I use an express nodeJS server to read and parse the text. This is converted to JSON data requested by the client here.
I then use Leaflet to present the data.

180 airports/aerodromes/heliports/airfields are listed by LFV
The small grey circles are ones that have no currently published NOTAMs.
The large orange circles show ones that have at least one currently published NOTAM.

Within a location, the notams are ordered in chronological order, and color-coded:
- grey for ones publishe dbut not currently active
- organge if they also are currently active.
