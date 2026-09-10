
# OpenRoomDto


## Properties

Name | Type
------------ | -------------
`id` | string
`name` | string
`playerCount` | number
`roundCount` | number
`trackSource` | string

## Example

```typescript
import type { OpenRoomDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "name": null,
  "playerCount": null,
  "roundCount": null,
  "trackSource": null,
} satisfies OpenRoomDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as OpenRoomDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


