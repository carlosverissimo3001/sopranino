
# FeedbackDto


## Properties

Name | Type
------------ | -------------
`id` | string
`kind` | string
`message` | string
`email` | string
`userId` | string
`userDisplayName` | string
`pagePath` | string
`userAgent` | string
`resolvedAt` | Date
`createdAt` | Date

## Example

```typescript
import type { FeedbackDto } from ''

// TODO: Update the object below with actual values
const example = {
  "id": null,
  "kind": null,
  "message": null,
  "email": null,
  "userId": null,
  "userDisplayName": null,
  "pagePath": null,
  "userAgent": null,
  "resolvedAt": null,
  "createdAt": null,
} satisfies FeedbackDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as FeedbackDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


