
export class PersonController {
  constructor(personService) {
    this.personService = personService;
  }

  async getPerson(req, res) {
    const { id } = req.params;
    const person = await this.personService.getPerson(id);
    res.json(person);
  }
}