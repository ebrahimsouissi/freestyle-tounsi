# Freestyle Tounsi

A freestyle rap trainer in Tunisian Darija. Pick a beat, press play, and a new Tunisian word drops every 4 ticks (one bar). Keep rhyming on the same sound until it switches.

## Features
- 14 built-in beats made in the browser: 5 kinds of Boom bap (Classic, Dusty Jazz, Dark Piano, Golden Era, Boom Bap Tounsi), Trap, Drill, Phonk, Mezoued, Stambeli, Lo-fi, G-funk, Afrobeats, Reggaeton
- Load your own MP3, or search a beat on YouTube and sync the words to it
- Challenge mode: 16 bars, topics, score, combos and a rank
- Speed control and 3 levels: Easy (a word every 2 bars), Normal (every bar), Hard (every 2 beats)
- Bar counter that follows the "new sound every 2 / 4 / 8 bars" setting
- About 100 starter words in Tunisian Arabizi, in 14 rhyme sounds
- Add your own words in Arabic or Latin letters (3, 7, 9) — rhyme sounds are detected automatically
- Shared word wall: words added on the live site are stored in Supabase and shown to everyone
- Guided tour for new visitors

## Run it
It's a single `index.html` file — open it in a browser, or host it with GitHub Pages.

Shared words are stored in a Supabase table `words` (read + insert for visitors; delete only from the Supabase dashboard).
