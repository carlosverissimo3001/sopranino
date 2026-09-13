
# MultiplayerRoundStateDto


## Properties

Name | Type
------------ | -------------
`sessionId` | string
`roundIndex` | number
`totalRounds` | number
`currentGuess` | number
`snippetDuration` | number
`snippetSteps` | Array&lt;number&gt;
`maxGuessesPerSong` | number
`status` | string
`guesses` | [Array&lt;GuessHistoryDto&gt;](GuessHistoryDto.md)
`previewUrl` | string
`answer` | [TrackOptionDto](TrackOptionDto.md)
`hints` | [Array&lt;HintDto&gt;](HintDto.md)

## Example

```typescript
import type { MultiplayerRoundStateDto } from ''

// TODO: Update the object below with actual values
const example = {
  "sessionId": null,
  "roundIndex": null,
  "totalRounds": null,
  "currentGuess": null,
  "snippetDuration": null,
  "snippetSteps": null,
  "maxGuessesPerSong": null,
  "status": null,
  "guesses": null,
  "previewUrl": null,
  "answer": null,
  "hints": null,
} satisfies MultiplayerRoundStateDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as MultiplayerRoundStateDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


