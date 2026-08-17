import bcrypt from "bcrypt";
import jwt, { SignOptions } from 'jsonwebtoken';


/**
 * Utility class with all the data security related functions
 */
export class Security {
 
  /**
   * Method to validate the secret and decode the jwt payload
   * @param token JWT token to be decoded
   * @param secret Secret used to generate the token
   * @returns Decoded JWT payload
   */
  static validateJwtToken(token: string, secret: string) {
    return jwt.verify(token, secret);
  }



  /**
   * Method to hash passwords with the given number of rounds for salt generation
   * @param password string to be hashed
   * @param saltRounds number of rounds for salt generation
   * @returns hash of the password
   */
  static hash(password: string, saltRounds: number) {
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Method to compare plain text password with it's hash
   * @param password string to be compared
   * @param hash hash of the string to be compared
   * @returns boolean based on the comparison
   */
  static validateHash(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }


  /**
   * Method to generate JWT token
   * @param payload Payload of the jwt token
   * @param secret Secret for the jwt token
   * @param expiresIn expressed in seconds or a string describing a time span [zeit/ms](https://github.com/zeit/ms.js).  Eg: 60, "2 days", "10h", "7d"
   * @returns jwt token
   */
  static generateJwtToken(
    payload: object,
    secret: string,
    expiresIn: string | number | undefined
  ) {
   // const options: SignOptions = expiresIn ? { expiresIn } : {};
   const options: SignOptions = expiresIn ? { expiresIn: expiresIn as SignOptions["expiresIn"] } : {}; 
    return jwt.sign(payload, secret, options);
  }


}

