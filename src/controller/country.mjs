
export class CountryController {
  constructor(countryService) {
    this.countryService = countryService;
  }

  async getCountry(req, res) {
    const { id } = req.params;
    const country = await this.countryService.getCountry(id);
    res.json(country);
  }
}