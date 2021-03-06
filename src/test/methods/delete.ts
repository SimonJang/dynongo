import test from 'ava';
import sinon from 'sinon';
import stubPromise from '../fixtures/stub-promise';
import db from '../..';

db.connect({prefix: 'delete'});

const Table = db.table('Table');

const sandbox = sinon.createSandbox();
let deleteStub;

test.before(() => {
	deleteStub = sandbox.stub(db.dynamodb !, 'delete');
	deleteStub.returns(stubPromise({Attributes: {id: '5', foo: 'bar'}}));
});

test.after(() => {
	sandbox.restore();
});

test.serial('delete', async t => {
	await Table.remove({id: '5'}).exec();

	t.deepEqual(deleteStub.lastCall.args[0], {
		TableName: 'delete.Table',
		Key: {
			id: '5'
		}
	});
});

test.serial('result', async t => {
	t.falsy(await Table.remove({id: '5'}).exec());
});

test.serial('where', async t => {
	await Table.remove({id: '5'}).where({foo: 'bar'}).exec();

	t.deepEqual(deleteStub.lastCall.args[0], {
		TableName: 'delete.Table',
		Key: {
			id: '5'
		},
		ConditionExpression: '#k_foo=:v_foo',
		ExpressionAttributeNames: {
			'#k_foo': 'foo'
		},
		ExpressionAttributeValues: {
			':v_foo': 'bar'
		}
	});
});

test.serial('find one and remove', async t => {
	await Table.findOneAndRemove({id: '5'}).exec();

	t.deepEqual(deleteStub.lastCall.args[0], {
		TableName: 'delete.Table',
		Key: {
			id: '5'
		},
		ReturnValues: 'ALL_OLD'
	});
});

test('find one and remove result', async t => {
	t.deepEqual(await Table.findOneAndRemove({id: '5'}).exec(), {id: '5', foo: 'bar'});
});

test('find one and remove raw result', async t => {
	t.deepEqual(await Table.findOneAndRemove({id: '5'}).raw().exec(), {Attributes: {id: '5', foo: 'bar'}});
});

test.serial('error if not connected', async t => {
	const original = db.dynamodb;
	db.dynamodb = undefined as any;

	await t.throwsAsync(Table.remove({id: '5'}).exec(), 'Call .connect() before executing queries.');

	db.dynamodb = original;
});
