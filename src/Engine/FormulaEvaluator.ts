import Cell from "./Cell"
import SheetMemory from "./SheetMemory"
import { ErrorMessages } from "./GlobalDefinitions";



export class FormulaEvaluator {
  // Define a function called update that takes a string parameter and returns a number
  private _errorOccured: boolean = false;
  private _errorMessage: string = "";
  private _currentFormula: FormulaType = [];
  private _lastResult: number = 0;
  private _sheetMemory: SheetMemory;
  private _result: number = 0;


  constructor(memory: SheetMemory) {
    this._sheetMemory = memory;
  }

  /**
    * place holder for the evaluator.   I am not sure what the type of the formula is yet 
    * I do know that there will be a list of tokens so i will return the length of the array
    * 
    * I also need to test the error display in the front end so i will set the error message to
    * the error messages found In GlobalDefinitions.ts
    * 
    * according to this formula.
    * 
    7 tokens partial: "#ERR",
    8 tokens divideByZero: "#DIV/0!",
    9 tokens invalidCell: "#REF!",
  10 tokens invalidFormula: "#ERR",
  11 tokens invalidNumber: "#ERR",
  12 tokens invalidOperator: "#ERR",
  13 missingParentheses: "#ERR",
  0 tokens emptyFormula: "#EMPTY!",

                    When i get back from my quest to save the world from the evil thing i will fix.
                      (if you are in a hurry you can fix it yourself)
                               Sincerely 
                               Bilbo
    * 
   */

  evaluate(formula: FormulaType)  {
    // set the this._result to the length of the formula

    
    let leftParen = 0;
    let rightParen = 0;
    let operatornum = 0;
    let numberCount = 0;

    let messageIndicator = 1;

    if (formula.length == 0) {
      messageIndicator = 0;
    }

    for (let i = 0; i < formula.length; i++) {
      let token = formula[i];

      if (token == "(") {
        leftParen++; 
      }
      else if (token == ")") {
        rightParen++;
      }
      else if (this.isOperator(token) == true) {
        operatornum++;
        if (i == 0 || i == formula.length - 1) {
          messageIndicator = 10;
          break;
        }
        else{
          let prevtoken = formula[i - 1];
          let nexttoken = formula[i + 1];
          if (this.isOperator(prevtoken) == true || this.isOperator(nexttoken) == true) {
            messageIndicator = 12;
            break;
          }
        }
      }
      else{
        if (i == 0){
          let nexttoken = formula[i + 1];
          if (this.isOperator(nexttoken) != true) {
            messageIndicator = 10;
            break;
          }
        }
        else if (i == formula.length - 1) {
          let prevtoken = formula[i - 1];
          if (this.isOperator(prevtoken) != true) {
            messageIndicator = 10;
            break;
          }
        }
        else {
          let prevtoken = formula[i - 1];
          let nexttoken = formula[i + 1];
          if (this.isOperator(prevtoken) != true || this.isOperator(nexttoken) != true) {
            messageIndicator = 10;
            break;
          }
        }
        numberCount++;
      }
    }

    if (leftParen != rightParen) {
      messageIndicator = 13;
    }

    this._result = formula.length;
    this._errorMessage = "";

    switch (messageIndicator) {
      case 0:
        this._errorMessage = ErrorMessages.emptyFormula;
        break;
      case 7:
        this._errorMessage = ErrorMessages.partial;
        break;
      case 8:
        this._errorMessage = ErrorMessages.divideByZero;
        break;
      case 9:
        this._errorMessage = ErrorMessages.invalidCell;
        break;
      case 10:
        this._errorMessage = ErrorMessages.invalidFormula;
        break;
      case 11:
        this._errorMessage = ErrorMessages.invalidNumber;
        break;
      case 12:
        this._errorMessage = ErrorMessages.invalidOperator;
        break;
      case 13:
        this._errorMessage = ErrorMessages.missingParentheses;
        break;
      default:
        this._errorMessage = "";
        break;
    }
  }

  public get error(): string {
    return this._errorMessage
  }

  public get result(): number {
    return this._result;
  }

  /**
   * 
   * @param token 
   * @returns true if the token is an operator
   */
  isOperator(token: TokenType): boolean {
    return token === "+" || token === "-" || token === "*" || token === "/";
  }

  /**
   * 
   * @param token 
   * @returns true if the toke can be parsed to a number
   */
  isNumber(token: TokenType): boolean {
    return !isNaN(Number(token));
  }

  /**
   * 
   * @param token
   * @returns true if the token is a cell reference
   * 
   */
  isCellReference(token: TokenType): boolean {

    return Cell.isValidCellLabel(token);
  }

  /**
   * 
   * @param token
   * @returns [value, ""] if the cell formula is not empty and has no error
   * @returns [0, error] if the cell has an error
   * @returns [0, ErrorMessages.invalidCell] if the cell formula is empty
   * 
   */
  getCellValue(token: TokenType): [number, string] {

    let cell = this._sheetMemory.getCellByLabel(token);
    let formula = cell.getFormula();
    let error = cell.getError();

    // if the cell has an error return 0
    if (error !== "" && error !== ErrorMessages.emptyFormula) {
      return [0, error];
    }

    // if the cell formula is empty return 0
    if (formula.length === 0) {
      return [0, ErrorMessages.invalidCell];
    }


    let value = cell.getValue();
    return [value, ""];

  }


}

export default FormulaEvaluator;