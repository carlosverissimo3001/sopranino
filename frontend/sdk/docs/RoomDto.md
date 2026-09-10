
# RoomDto


## Properties

Name | Type
------------ | -------------
`id` | string
`inviteCode` | string
`hostId` | string
`name` | string
`findable` | boolean
`capacity` | number
`roundCount` | number
`status` | string
`trackSource` | string
`players` | [Array&lt;RoomPlayerDto&gt;](RoomPlayerDto.md)
`createdAt` | Date
`startedAt` | Date
`completedAt` | Date

## Example

```typescript
import type { RoomDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "inviteCode": null,
  "hostId": null,
  "name": null,
  "findable": null,
  "capacity": null,
  "roundCount": null,
  "status": null,
  "trackSource": null,
  "players": null,
  "createdAt": null,
  "startedAt": null,
  "completedAt": null,
} satisfies RoomDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as RoomDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


