const ffi = require('ffi-napi');
const ref = require('ref-napi');
 
const sqlite3 = ref.types.void;
const sqlite3Ptr = ref.refType(sqlite3);
const sqlite3PtrPtr = ref.refType(sqlite3Ptr);
 
const sqlstatement = ref.types.void;
const sqlstatementPtr = ref.refType(sqlstatement);
const sqlstatementPtrPtr = ref.refType(sqlstatementPtr);
 
// yoink constants from reading sqlite3.h and put here



const _lib = ffi.Library('libsqlite3', {
  'sqlite3_open': [ 'int', [ 'string', sqlite3PtrPtr ] ],
  'sqlite3_prepare_v2': [ 'int', [ sqlite3Ptr, 'string', 'int', sqlstatementPtrPtr, 'int' ] ],
  'sqlite3_close': [ 'int', [ sqlite3Ptr ] ],
  'sqlite3_exec': [ 'int', [ sqlite3Ptr, 'string', 'pointer', 'pointer', 'string' ] ],
  'sqlite3_step' : ['int', [sqlstatementPtr]],
  'sqlite3_column_type' : [ 'int', [sqlstatementPtr, 'int']],
  'sqlite3_column_text':['string', [sqlstatementPtr, 'int']],
  'sqlite3_column_name':['string', [sqlstatementPtr, 'int']],
  'sqlite3_column_count':['int',[sqlstatementPtr]],
  'sqlite3_column_int':['int',[sqlstatementPtr, 'int']],
  'sqlite3_column_double':['double',[sqlstatementPtr, 'int']],
  'sqlite3_bind_double':['int', [sqlstatementPtr, 'int', 'double']],
  'sqlite3_bind_int64':['int', [sqlstatementPtr, 'int', 'long long']],
  'sqlite3_bind_text':['int',[sqlstatementPtr, 'int', 'string', 'int', 'long long']]
  
});
 
// eventually, your code should be structured into this class
class SQLite 
{
  #db;
  constructor(filename=':memory:') {
  this.db = ref.alloc(sqlite3PtrPtr);
  const rc = _lib.sqlite3_open(filename, this.db);
  }
  query(parameter, binding = []) {
    const res = ref.alloc(sqlstatementPtrPtr);
    let rc = _lib.sqlite3_prepare_v2(this.db.deref(), parameter, -1, res, 0);
    
    let returnVal = [];
    
    for(let i = 0; i<binding.length; i++){
        let type = typeof(binding[i]);
        if(type == 'number'){
            if(Number.isInteger(type)){
                _lib.sqlite3_bind_int64(res.deref(), i+1, binding[i]);
            }
            else{
                _lib.sqlite3_bind_double(res.deref(), i+1, binding[i]);
            }
        }
        else if(type == 'string'){
            _lib.sqlite3_bind_text(res.deref(), i+1, binding[i], binding[i].length, 0);
        }
    }

    while(_lib.sqlite3_step(res.deref())==100){
        let obj = {}
        for(let i = 0; i<_lib.sqlite3_column_count(res.deref()); i++){
            let type =  _lib.sqlite3_column_type(res.deref(),i);
            if(type == 3){
               obj[_lib.sqlite3_column_name(res.deref(), i)]= _lib.sqlite3_column_text(res.deref(), i);
               }
            if(type == 1){
                obj[_lib.sqlite3_column_name(res.deref(), i)]= _lib.sqlite3_column_int(res.deref(),i);
                }
            if(type == 2){
                obj[_lib.sqlite3_column_name(res.deref(), i)] = _lib.sqlite3_column_double(res.deref(), i);
                }
            }
            returnVal.push(obj)
        }

    return returnVal;    

    }
    
    
}

 

// and should be callable like below
//{
  //const db = new SQLite();
  //console.log(db.query('SELECT SQLITE_VERSION()'));
//}
 
 
// use below as a playground
//let rc = 0;
 
// translation of
// sqlite3 *db;
// int rc = sqlite3_open(':memory:', &db);
// printf("%d\n", rc);
//const ss_db = ref.alloc(sqlite3PtrPtr);
//rc = _lib.sqlite3_open(':memory:', ss_db);
//console.log(rc);
 
// translation of
// sqlite3 *db;
// sqlite3_stmnt *res;
// int rc = sqlite3_prepare_v2(db, "SELECT SQLITE_VERSION()", -1, &res, 0);
// printf("%d\n", rc);
//const res = ref.alloc(sqlstatementPtrPtr);
//rc = _lib.sqlite3_prepare_v2(ss_db.deref(), 'SELECT SQLITE_VERSION()', -1, res, 0);
//console.log(rc);

const db = new SQLite();
console.log(db.query('SELECT SQLITE_VERSION()'));
console.log(db.query('CREATE TABLE test (id TEXT)'));
console.log(db.query('CREATE TABLE test2 (id INT)'));
console.log(db.query('INSERT INTO test (id) VALUES ("a")'));
console.log(db.query('INSERT INTO test2 (id) VALUES (5)'));
console.log(db.query('SELECT * FROM test'));
console.log(db.query('SELECT * FROM test2'));
console.log(db.query('SELECT * FROM test WHERE id=?', ["a"]));
console.log(db.query('SELECT * FROM test2 WHERE id=?', [5]));
