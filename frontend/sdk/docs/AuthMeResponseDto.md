
# AuthMeResponseDto


## Properties

Name | Type
------------ | -------------
`userId` | string
`spotifyUserId` | string
`hasLinkedAccount` | boolean
`hasAccount` | boolean
`email` | string
`emailVerified` | boolean
`pendingEmail` | string
`displayName` | string
`avatarUrl` | string
`customAvatarUrl` | string
`spotifyAvatarUrl` | string
`avatarSource` | string
`isTrusted` | boolean
`isAdmin` | boolean
`country` | string

## Example

```typescript
import type { AuthMeResponseDto } from ''

// TODO: Update the object below with actual values
const example = {
  "userId": null,
  "spotifyUserId": null,
  "hasLinkedAccount": false,
  "hasAccount": false,
  "email": null,
  "emailVerified": false,
  "pendingEmail": null,
  "displayName": null,
  "avatarUrl": null,
  "customAvatarUrl": null,
  "spotifyAvatarUrl": null,
  "avatarSource": null,
  "isTrusted": false,
  "isAdmin": false,
  "country": null,
} satisfies AuthMeResponseDto

console.log(example)

// Convert the instance to a JSON string
const exampleJSON: string = JSON.stringify(example)
console.log(exampleJSON)

// Parse the JSON string back to an object
const exampleParsed = JSON.parse(exampleJSON) as AuthMeResponseDto
console.log(exampleParsed)
```

[[Back to top]](#) [[Back to API list]](../README.md#api-endpoints) [[Back to Model list]](../README.md#models) [[Back to README]](../README.md)


