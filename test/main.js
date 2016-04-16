'use strict';
let expect = require('chai').expect,
	request = require('request');
	
describe("Server test", () => {
	it("Test HTTP 200", done => {
		request('http://localhost:8080/200').on('response', response => {
			expect(response.statusCode).to.equal(200);
			done();
		});
	});
	it("Test HTTP 400", done => {
		request('http://localhost:8080/400').on('response', response => {
			expect(response.statusCode).to.equal(400);
			done();
		});
	});
	it("Test HTTP 404", done => {
		request('http://localhost:8080/404').on('response', response => {
			expect(response.statusCode).to.equal(404);
			done();
		});
	});
});
// describe("Server test", () => {
// 	it("Test HTTP 200", done => {
// 		request('http://localhost:8080/200').on('response', response => {
// 			expect(response.statusCode).to.equal(200);
// 			done();
// 		});
// 	});
// 	it("Test HTTP 400", done => {
// 		request('http://localhost:8080/400').on('response', response => {
// 			expect(response.statusCode).to.equal(400);
// 			done();
// 		});
// 	});
// 	it("Test HTTP 404", done => {
// 		request('http://localhost:8080/404').on('response', response => {
// 			expect(response.statusCode).to.equal(404);
// 			done();
// 		});
// 	});
// });