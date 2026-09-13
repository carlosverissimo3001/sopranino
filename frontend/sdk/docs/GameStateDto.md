
# GameStateDto


## Properties

Name | Type
------------ | -------------
`sessionId` | string
`currentRound` | number
`snippetDuration` | number
`maxRounds` | number
`snippetSteps` | Array&lt;number&gt;
`status` | string
`guesses` | [Array&lt;GuessHistoryDto&gt;](GuessHistoryDto.md)
`previewUrl` | string
`answer` | [TrackOptionDto](TrackOptionDto.md)
`albumImageUrl` | string
`rankTitle` | string
`specialNote` | string
`hints` | [Array&lt;HintDto&gt;](HintDto.md)
`choices` | [Array&lt;TrackOptionDto&gt;](TrackOptionDto.md)

## Example

```typescript
import type { GameStateDto } from ''

// TODO: Update the object below with actual values
const example = {
  "sessionId": null,
  "currentRound": null,
  "snippetDuration": null,
  "maxRounds": null,
  "snippetSteps": null,
  "status": null,
  "guesses": null,
  "previewUrl": null,
  "answer": null,
  "albumImageUrl": null,
  "rankTitle": null,
  "specialNote": null,
  "hints": null,
  "choices": null,
} satisfies GameStateDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GameStateDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


