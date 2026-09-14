
# GauntletGuessResultDto


## Properties

Name | Type
------------ | -------------
`correct` | boolean
`runOver` | boolean
`score` | number
`status` | string
`actualTrack` | [ActualTrackDto](ActualTrackDto.md)
`nextPreviewUrl` | string
`nextSnippetDuration` | number
`isNewPersonalBest` | boolean
`isNewDailyBest` | boolean
`guessedTracks` | [Array&lt;ActualTrackDto&gt;](ActualTrackDto.md)

## Example

```typescript
import type { GauntletGuessResultDto } from ''

// TODO: Update the object below with actual values
const example = {
  "correct": null,
  "runOver": null,
  "score": null,
  "status": null,
  "actualTrack": null,
  "nextPreviewUrl": null,
  "nextSnippetDuration": null,
  "isNewPersonalBest": null,
  "isNewDailyBest": null,
  "guessedTracks": null,
} satisfies GauntletGuessResultDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GauntletGuessResultDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


