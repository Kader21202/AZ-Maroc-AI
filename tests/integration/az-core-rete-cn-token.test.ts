import type {
  AZCnPartnerToken,
  AZCnToken,
} from "../../src/engines/cognitive/az/core/production/AZCnToken"

const countPartnerTokens = (
  token: AZCnToken,
): number => token.cnPartnerTokens.length

const leftToken: AZCnToken = {
  parent: null,
  workingMemoryElement: null,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
  cnPartnerTokens: [],
}

const partnerToken: AZCnPartnerToken = {
  parent: null,
  workingMemoryElement: null,
  node: null,
  hashReferent: null,
  negativeMatches: [],
  children: [],
  leftToken,
}

leftToken.cnPartnerTokens.push(partnerToken)

if (countPartnerTokens(leftToken) !== 1) {
  throw new Error("AZCnToken partner-token registration mismatch")
}

if (leftToken.cnPartnerTokens[0] !== partnerToken) {
  throw new Error("AZCnToken partner-token identity mismatch")
}

if (partnerToken.leftToken !== leftToken) {
  throw new Error("AZCnPartnerToken left-token link mismatch")
}

leftToken.cnPartnerTokens.splice(0, 1)

if (countPartnerTokens(leftToken) !== 0) {
  throw new Error("AZCnToken partner-token removal mismatch")
}

console.log("AZ core RETE CN token contracts: OK")
