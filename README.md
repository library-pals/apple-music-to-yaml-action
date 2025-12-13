# apple-music-to-yaml-action

Add Apple Music playlists to YAML using data from an Apple Shortcut.

## How it works

This action is designed to work with an Apple Shortcut that extracts playlist data from Apple Music and sends it as JSON to your GitHub workflow.

## Apple Shortcut

To be added...

### Setting up the Apple Shortcut

1. Create an Apple Shortcut that:

   - Gets playlist information from Apple Music
   - Formats it as JSON with this structure:

   ```json
   {
     "playlist": "Playlist Name",
     "link": "https://music.apple.com/library/playlist/p.abc123",
     "tracks": [
       {
         "track": "Song Title",
         "artist": "Artist Name",
         "album": "Album Name"
       }
     ]
   }
   ```

   - Triggers your GitHub workflow with the JSON data

2. The GitHub Action will then process this JSON and add it to your playlists YAML file

<!-- START GENERATED DOCUMENTATION -->

## Set up the workflow

To use this action, create a new workflow in `.github/workflows` and modify it as needed:

```yml
name: Save Apple Music playlist

on:
  workflow_dispatch:
    inputs:
      playlist-json:
        description: JSON string containing playlist data from Apple Shortcut
        required: true

permissions:
  contents: write

jobs:
  apple-music-to-yaml:
    runs-on: ubuntu-latest
    name: Save Apple Music playlist
    steps:
      - name: Checkout
        uses: actions/checkout@v6
      - name: Save the playlist
        uses: library-pals/apple-music-to-yaml-action@v0.1.0
        with:
          playlist-json: ${{ inputs.playlist-json }}
          filename: _data/playlists.yml
      - name: Commit files
        run: |
          git pull
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add -A && git commit -m "🎵 ${{ env.playlist }}"
          git push
```

## Action options

- `playlist-json`: Required. JSON string containing playlist data from Apple Shortcut

- `filename`: The YAML file to write your playlists. Default: `_data/playlists.yml`.

## Trigger the action

To trigger the action, [create a workflow dispatch event](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event) with the following body parameters:

```js
{
  "ref": "main", // Required. The git reference for the workflow, a branch or tag name.
  "inputs": {
    "playlist-json": "", // Required. JSON string containing playlist data from Apple Shortcut
  }
}
```

<!-- END GENERATED DOCUMENTATION -->
