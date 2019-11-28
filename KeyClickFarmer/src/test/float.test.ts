import {assert} from "chai";

import Decimal from "../modules/decimal";

describe("test Decimal", () => {

    it("保存チェック", () => {
        const target = new Decimal("56781234567812345678");
        assert.equal(target.toNumbers()[0], 0);
        assert.equal(target.toNumbers()[1], 12345678);
        assert.equal(target.toNumbers()[2], 12345678);
        assert.equal(target.toNumbers()[3], 5678);
        assert.equal(target.toNumbers()[4], 0);
        assert.equal(target.toString(), "56781234567812345678");
    })

    it("保存チェック2", () => {
        const target = new Decimal("56781234567812345678.1234");
        assert.equal(target.toNumbers()[0], 12340000);
        assert.equal(target.toNumbers()[1], 12345678);
        assert.equal(target.toNumbers()[2], 12345678);
        assert.equal(target.toNumbers()[3], 5678);
        assert.equal(target.toNumbers()[4], 0);
        assert.equal(target.toString(), "56781234567812345678.1234");
    })
    
    it("足し算チェック", () => {
        const target1 = new Decimal("111111112222222233333333.4444");
        const target2 = new Decimal("111111112222222233333333.4444");
        const target3 = new Decimal("555555555555555555555555.5");
        const target4 = new Decimal("99999999999999999999999999999999");
        const other1 = new Decimal("111111111111111111111111");
        const other2 = new Decimal("0.11115");
        const other3 = new Decimal("444444444444444444444444.5");
        const other4 = new Decimal("1");
        assert.equal(target1.add(other1).toString(), "222222223333333344444444.4444");
        assert.equal(target2.add(other2).toString(), "111111112222222233333333.55555");
        assert.equal(target3.add(other3).toString(), "1000000000000000000000000");
        assert.throws(() => target4.add(other4), RangeError);
    })

    it("引き算チェック", () => {
        const target1 = new Decimal("222222223333333344444444.4444");
        const target2 = new Decimal("111111112222222233333333.55555");
        const target3 = new Decimal("1000000000000000000000000");
        const target4 = new Decimal("999999999999999999999999");
        const other1 = new Decimal("111111111111111111111111");
        const other2 = new Decimal("0.11115");
        const other3 = new Decimal("444444444444444444444444.5");
        const other4 = new Decimal("1000000000000000000000000");
        assert.equal(target1.sub(other1).toString(), "111111112222222233333333.4444");
        assert.equal(target2.sub(other2).toString(), "111111112222222233333333.4444");
        assert.equal(target3.sub(other3).toString(), "555555555555555555555555.5");
        assert.throws(() => target4.sub(other4), RangeError);
    })
    
    it("かけ算チェック", () => {
        const target1 = new Decimal("111111111111111111111111");
        const target2 = new Decimal("111111111111111111111111");
        const target3 = new Decimal("111111111111111111111111");
        const other1 = 3;
        const other2 = 1.1;
        const other3 = 100;
        assert.equal(target1.mul(other1).toString(), "333333333333333333333333");
        assert.equal(target2.mul(other2).toString(), "122222222222222222222222.1");
        assert.equal(target3.mul(other3).toString(), "11111111111111111111111100");
    })
});