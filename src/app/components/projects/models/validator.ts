export class Validator {
    static projectNameValidator(projectName) {
      var pattern = new RegExp(/[~`!#$%\^&*+=\[\]\\';,/{}|\\":<>\?]/);

      if(!pattern.test(projectName.value)) {
        return null;
      }

      return { invalidName: true }
    }
}