import { APIGatewayProxyEvent } from "aws-lambda";
import { parseUserId, parseUserName, parseUserPictureURL } from "../auth/utils";

export function getUserId(event: APIGatewayProxyEvent): string {
  const jwtToken = splitToken(event.headers.Authorization)
  return parseUserId(jwtToken)
}

export function getUserName(event: APIGatewayProxyEvent): string {
  const jwtToken = splitToken(event.headers.Authorization)
  return parseUserName(jwtToken)
}

export function getUserPictureURL(event: APIGatewayProxyEvent): string {
  const jwtToken = splitToken(event.headers.Authorization)
  return parseUserPictureURL(jwtToken)
}

function splitToken(authorization: string): string {
  const split = authorization.split(' ')
  return split[1]
}