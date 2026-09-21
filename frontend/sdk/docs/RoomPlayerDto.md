
# RoomPlayerDto


## Properties

Name | Type
------------ | -------------
`id` | string
`userId` | string
`displayName` | string
`avatarUrl` | string
`totalScore` | number
`joinedAt` | Date

## Example

```typescript
import type { RoomPlayerDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "userId": null,
  "displayName": null,
  "avatarUrl": null,
  "totalScore": null,
  "joinedAt": null,
} satisfies RoomPlayerDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RoomPlayerDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


