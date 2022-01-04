# League of Legends profile data scraper

[Try it online!](https://abrman.github.io/lol-profile-data-scraper/)
[Watch video of how to use the tool](https://www.youtube.com/watch?v=hKzVoFwX5RU)

## From the author

This project was something I did to get a little familiar wih React and Machine learning in early-mid 2020. I no longer intend to update it.
The current published version should contain all champions and skins up until January 1st 2022.

## Updating the machine learning models

Whenever a new champion is released, running `model_training/generate_model.py` should do everything from downloading assets, augmenting the data & training the model. Ideally can be done in one go (can take a couple hours). It should update the model within the react app, so all you need to publish, is just `npm run build` and commit changes.

## What this tool does

This tool allows user to scrape data from their League of Legends profile via Screen Sharing API directly on a website without any data being shared and all computation done locally.

In simple terms the plan of this project is to guide the user to scroll the views such as _Loot_ and _Collection_ within the client while sharing the window with this website. This tool should capture relevant views and then use machine learning models to determine what champion/skin/shard/permanent etc. is in view and allow user to Export a table with all relevant information about their account.

# The ideal output of this tool:

1. A table of champions, their ownership, chest availability, mastery, and whether a shard is owned.
2. A table of all loot items, their value for disenchantment and crafting.
3. Screenshots of the relevant captured images.

# Tasks:

```
**Capture views:**
🟢 Loot
🟢 Collection - Champions
🟢 Collection - Skins
🟢 Emotes
🟢 Icons
⚫ Wards
⚫ Chromas

**Download assets to train model for views:**
🟠 Loot ("little_legends", "emotes" & "icons" are skipped)
🟢 Collection - Champions
🟢 Collection - Skins
⚫ Emotes
⚫ Icons
⚫ Wards
⚫ Chromas

**Train a classification model for views:**
🟠 Loot ("little_legends", "emotes" & "icons" are skipped)
🟢 Collection - Champions
🟢 Collection - Skins
⚫ Emotes
⚫ Icons
🟡 Wards (Loot ward model might work maybe)
⚫ Chromas

**Present usable data:**
🟢 Create front end UI
⚫ Currencies spent on owned items
⚫ Ideal champions to craft to maximize champions owned
⚫ Blue essence & Orange essence if everything was disenchanted
⚫ Counts of everything owned (Example: 103/155 Champions owned, 32/1200 skins owned, etc.)
⚫ Blue essence & Orange essence if everything was disenchanted

	Tables: (with tick-box "Show unowned" where hidden if no ownership or available shards permanents available)
    ⚫ Champions table:
    | Champion name | Owned | Champion Mastery | Chest available | Shards owned | Permanents owned | Eternal Shards | Store BE price | Store RP price | Shard upgrade BE cost | Disenchat Shard gain | Disenchant Permanent gain
    ⚫ Skins table:
    | Skin name | Owned | Shards owned | Permanents owned | Store RP price | Shard upgrade OE cost | Disenchat Shard gain | Disenchant Permanent gain

    ⚫ Wards table:
    ⚫ Icons table:
    ⚫ Emotes table:


**Utility:**
🟢 Large screenshot support:
Implement support for skin & loot libraries that span in height over 32767px (canvas height limit in most modern browsers)
🟢 Interface manager improvements:
Explore faster ways to get current view. Like One draw call and asking for data of interesting pixels rather than doing a 1x1px draw calls multiple times.
⚫ Allow each view to alert the user that "show unowned" is enabled
⚫ Fetch lookup data caching (don't want to call fetch requests twice for same file)

**Extra:**
⚫ ALL OUT KDA Seraphine has 3 forms
```
