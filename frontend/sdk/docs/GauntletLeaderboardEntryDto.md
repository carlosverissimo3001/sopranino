
# GauntletLeaderboardEntryDto


## Properties

Name | Type
------------ | -------------
`rank` | number
`userId` | string
`displayName` | string
`isHidden` | boolean
`avatarUrl` | string
`score` | number
`trackGroupName` | string

## Example

```typescript
import type { GauntletLeaderboardEntryDto } from ''

// TODO: Update the object below with actual values
const example = {
  "rank": null,
  "userId": null,
  "displayName": null,
  "isHidden": null,
  "avatarUrl": null,
  "score": null,
  "trackGroupName": null,
} satisfies GauntletLeaderboardEntryDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as GauntletLeaderboardEntryDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


