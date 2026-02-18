import {PrivilegeChange} from "@components/role-management/role-detail/privilege/privilegeChange";

const one = "8a6cda1a-9842-4cbe-94da-a7eb97562c96";
const two = "97acaefe-b378-46d0-937e-e9aa22cf8a93";
const three = "8be17c2f-4d83-4492-a494-f354dbd8cc4f";
const four = "aaf2a160-5c7b-4775-98f7-a431b00c9e5a";
const five = "def0f758-b10b-4bc6-a4f4-6461cd5cdcfb"

const owned = [one, two, three]
describe('#PrivilegeChange', () => {


  it('should create', () => {
    const changer = new PrivilegeChange(owned);
  });
  it("Should add need privilege id", () => {
    const changer = new PrivilegeChange(owned);
    changer.add(four);
    expect(changer.get().add).toEqual([four]);
  });
  it("Should not add already owned privilege id", () => {
    const changer = new PrivilegeChange(owned);
    changer.add(one);
    expect(changer.get().add).toEqual([]);
  });
  it("Should delete owned privilege", () => {
    const changer = new PrivilegeChange(owned);
    changer.delete(one);
    expect(changer.get().delete).toEqual([one]);
  });
  it("Should not delete not owned privilege id", () => {
    const changer = new PrivilegeChange(owned);
    changer.delete(four);
    expect(changer.get().delete).toEqual([]);
  })
  it("Should reset already added id", () => {
    const changer = new PrivilegeChange(owned);
    changer.add(four);
    expect(changer.get().add).toEqual([four]);
    expect(changer.get().delete).toEqual([]);
    changer.delete(four);
    expect(changer.get().add).toEqual([]);
    expect(changer.get().delete).toEqual([]);
  });
  it("Should reset already deleted id", () => {
    const changer = new PrivilegeChange(owned);
    changer.delete(one);
    expect(changer.get().delete).toEqual([one]);
    expect(changer.get().add).toEqual([]);
    changer.add(one);
    expect(changer.get().delete).toEqual([]);
    expect(changer.get().add).toEqual([]);
  });

});
