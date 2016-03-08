'use strict';

var expect = require( 'chai' ).expect;

var freshy = require( 'freshy' );

var jwtSimple = require( 'jwt-simple' );

function makeSuccessContext( done, expected ) {

    if( !expected ) {

        expected = 'ok';
    }

    return {

        succeed: function( result ) {

            expect( result ).to.eql( expected );

            done(); 
        },

        fail: function( err ) {

            done( err );
        }
    };
}

function makeFailContext( done ) {

    return  {

        succeed: function( result ) {

                done( new Error( 'should not succeed' ) );
            },

        fail: function( err ) {

            expect( err ).to.be.an.instanceof( Error );

            done();
        }
    };
}

describe( 'index', function() {

    var vandium;

    beforeEach( function() {

        freshy.unload( '../index' );
        freshy.unload( '../lib/config' );
        freshy.unload( '../lib/jwt' );
    });

	describe( '.vandium', function( done ) {

		it( 'simple wrap with no jwt or validation', function( done ) {

            vandium = require( '../index' );

            var handler = vandium( function( event, context ) {

                context.succeed( 'ok' );
            });

            handler( {}, makeSuccessContext( done ) );
        });

        it( 'simple validation', function( done ) {

            vandium = require( '../index' );

            vandium.validation( {

                name: vandium.types.string().required(),

                age: vandium.types.number().min( 0 ).max( 120 ).required(),

                jwt: vandium.types.any()
            });

            vandium.jwt().configure( {

                algorithm: 'HS256',
                secret: 'super-secret' 
            });

            var handler = vandium( function( event, context ) {

                context.succeed( 'ok' );
            });

            var token = jwtSimple.encode( { user: 'fred' }, 'super-secret', 'HS256' );

            handler( { name: 'fred', age: 16, jwt: token }, makeSuccessContext( done ) );
        });

        it( 'validation where value is missing', function( done ) {

            vandium = require( '../index' );

            vandium.validation( {

                name: vandium.types.string().required(),

                age: vandium.types.number().min( 0 ).max( 120 ).required()
            })

            var handler = vandium( function( event, context ) {

                context.succeed( 'ok' );
            });

            handler( { name: 'fred' }, makeFailContext( done ) );
        });
	});

    describe( '.jwt', function() {

        it( 'normal operation', function() {

            vandium = require( '../index' );

            var jwt = vandium.jwt();

            // stage vars should be enabled by default
            expect( jwt.configuration() ).to.eql( { key: undefined, algorithm: undefined, tokenName: 'jwt', stageVars: true } );
            
            var jwtConfig = vandium.jwt().configure( { algorithm: 'HS256', secret: 'my-secret' } );
            expect( jwtConfig ).to.eql( { key: 'my-secret', algorithm: 'HS256', tokenName: 'jwt', stageVars: false } );

            // should still be set
            jwt = vandium.jwt();
            expect( jwt.configuration() ).to.eql( { key: 'my-secret', algorithm: 'HS256', tokenName: 'jwt', stageVars: false } );
        });
    });

    describe( '.validation', function() {

        it( 'normal operation', function() {

            vandium = require( '../index' );

            // no params should be ok
            vandium.validation();

            // call again with schema
            vandium.validation( {

                name: vandium.types.string()
            });
        });
    });
});
