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

    
    let parenthesesCount = 0;
    // Set the initial error message indicator to 1
    let messageIndicator = 1;

    // Two stakcs for operators and values
    const operators: string[] = [];
    const values: number[] = [];

    // Calculate the result of the one single operation
    function calculate(){
      const operator = operators.pop();
      const rightNumber: number = values.pop()!;
      const leftNumber: number = values.pop()!;

      switch(operator){
        case "+":
          values.push(leftNumber + rightNumber);
          break;
        case "-":
          values.push(leftNumber - rightNumber);
          break;
        case "*":
          values.push(leftNumber * rightNumber);
          break;
        case "/":
          if (rightNumber == 0){
            messageIndicator = 8;
            break;
          }
          values.push(leftNumber / rightNumber);
          break;
      }
    }

    // Loop through the formula and check for errors and push the values and operators to the stacks
    for (let i = 0; i < formula.length; i++) {
      let token = formula[i];

      // if there's a left parenthesis, its previous and next token can only be an operator or a left parenthesis
      if (token == "(") {
        if (i != 0) {
          let prevtoken = formula[i - 1];
          if (this.isOperator(prevtoken) != true && prevtoken != "(") {
            messageIndicator = 12;
            break;
          }
        }
        parenthesesCount++; 
        operators.push(token);
      }
      
      else if (token == ")") {
        // if there's no left parenthesis before the right parenthesis, there is an error
        if (parenthesesCount == 0) {
          messageIndicator = 13;
          break;
        }
        // if there's nothing between patenthesis, there is an error
        else if (formula[i-1] == "(") {
          parenthesesCount--;
          messageIndicator = 13;
          break;
        }
        // if the previous token is an opertor, there is an error
        else if (this.isOperator(formula[i-1]) == true) {
          parenthesesCount--;
          messageIndicator = 10;
          break;
        }
        // if the parenthesis is valid, calculate the result between the parenthesis
        while (operators[operators.length - 1] != "(") {
          calculate();
        }
        operators.pop();
        parenthesesCount--;
      }

      else if (this.isOperator(token) == true) {
        // if the operator is the first or last token, there is an error
        if (i == 0 || i == formula.length - 1) {
          messageIndicator = 10;
          break;
        }
        // if the previous or next token is an operator, there is an error
        else{
          let prevtoken = formula[i - 1];
          let nexttoken = formula[i + 1];
          if (this.isOperator(prevtoken) == true || this.isOperator(nexttoken) == true) {
            messageIndicator = 12;
            break;
          }
          // if the previous operator in stack has higher precedence, calculate the result on the stack first
          if ((token == '+' || token == '-' && operators.length > 0) && (operators[operators.length - 1] == '*'
            || operators[operators.length - 1] == '/')) {
            while (operators.length > 0 && (operators[operators.length - 1] != '+'
              || operators[operators.length - 1] != '-')){
              calculate();
            }
          }
          operators.push(token);
        }
      }
      // if the token is a cell reference, get the value of the cell
      else if (formula.length > 1 && this.isCellReference(token) == true) {
        // if the cell is the first token, its next token can only be an operator
        if (i == 0 ) {
          if (this.isOperator(formula[i + 1]) != true) {
            messageIndicator = 10;
            break;
          }
        }
        // if the cell is the last token, its previous token can only be an operator
        else if (i == formula.length - 1) {
          if (this.isOperator(formula[i - 1]) != true) {
            messageIndicator = 10;
            break;
          }
        }
        // if the cell is not the first or last token, its previous and next token can only be an operator
        else {
          let prevtoken = formula[i - 1];
          let nexttoken = formula[i + 1];
          if (this.isOperator(prevtoken) != true || this.isOperator(nexttoken) != true) {
            messageIndicator = 10;
            break;
          }
        }
        // if the reference cell has an error, there is an error, else push the value to the stack
        values.push(this.getCellValue(token)[0]);
        if (this.getCellValue(token)[1] != "") {
          messageIndicator = 10;
          break;
        }
      }
      // if there's only one token and it's a cell reference, get the value of the cell
      else if (formula.length == 1 && this.isCellReference(token) == true) {
        values.push(this.getCellValue(token)[0]);
        if (this.getCellValue(token)[1] == ErrorMessages.invalidCell) {
          messageIndicator = 9;
          break;
        }
      }
      // if the token is a number, simply push the value to the stack, because all errors have been checked
      else if (this.isNumber(token) == true) {
        values.push(Number(token));
      }
    }
    
    // if the formula is empty, set the message to be empty formula
    if (formula.length == 0) {
      messageIndicator = 0;
    }

    // if there's still left parenthesis, there is an error
    if (parenthesesCount != 0) {
      messageIndicator = 13;
    }

    // calculate all operations on the stack
    while (operators.length > 0) {
      calculate();
    }
    
    if (values.length == 1) {
      this._result = values.pop()!;
    }
    else {
      this._result = 0;
    }
    // if left parentheses and right parentheses are equal but there's no value between, set value to 0
    if (parenthesesCount == 0 && messageIndicator == 13) {
      this._result = 0;
    }
    
    this._errorMessage = "";

    // set the error message according to the message indicator
    switch (messageIndicator) {
      case 0:
        this._errorMessage = ErrorMessages.emptyFormula;
        break;
      case 7:
        this._errorMessage = ErrorMessages.partial;
        break;
      case 8:
        this._errorMessage = ErrorMessages.divideByZero;
        this._result = Infinity;
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