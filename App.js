// Imports
import {
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  Dimensions,
  View,
  useWindowDimensions,
} from 'react-native';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  ScrollView,
  TapGestureHandler,
} from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDecay,
  withTiming,
} from 'react-native-reanimated';
import {DarkTheme, DefaultTheme} from '@react-navigation/native';
import {useEffect, useMemo, useRef, useState} from 'react';
import {Icon} from '@rneui/themed';

//Global Utils
const {width, height} = Dimensions.get('screen');
const heightOfBarInit = height * 0.28;
const heightOfBarIncrease = height * 0.325;
const homescreens = [0, width * -0.35, width * -0.75];

function App() {
  //Local Reactive State
  const {width, height} = useWindowDimensions();
  const [theme, setTheme] = useState(0);
  const [notificationBarActive, setNotificationBarActive] = useState(false);
  const [notificationBarIsOpen, setNotificationBarIsOpen] = useState(false);
  const [colors, setColors] = useState({
    ...DefaultTheme.colors,
    icon_color: 'black',
  });
  const [currentScreen, setCurrentScreen] = useState(0);
  const [isHorizontalScrolling, setIsHorizontalScrolling] = useState(0);

  //Memo for Theme
  useMemo(() => {
    if (!theme) setColors({...DefaultTheme.colors, icon_color: 'black'});
    else setColors({...DarkTheme.colors, icon_color: 'lightgrey'});
  }, [theme]);

  //Handlers
  const setActive = value => {
    if (value !== notificationBarActive) setNotificationBarActive(value);
  };

  const setOpen = value => {
    if (value !== notificationBarIsOpen) setNotificationBarIsOpen(value);
  };

  const setHorizontalScrolling = value => {
    if (value !== isHorizontalScrolling) setIsHorizontalScrolling(value);
  };

  const setScreen = screen => setCurrentScreen(screen);

  //Shared Animate Value
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateYInit = useSharedValue(-heightOfBarInit);

  //PanGesture Handler
  const panGestureEvent = useAnimatedGestureHandler({
    onStart: (event, context) => {
      context.startY = translateY.value;
      context.startYInit = translateYInit.value;
    },
    onActive: (event, context) => {
      if (
        !notificationBarIsOpen &&
        event.translationY + context.startYInit > -heightOfBarInit &&
        event.translationY + context.startYInit < 0
      )
        translateYInit.value = event.translationY + context.startYInit;

      if (
        event.translationY + context.startY > 0 &&
        event.translationY + context.startY < heightOfBarIncrease
      )
        translateY.value = event.translationY + context.startY;
    },
    onEnd: (event, context) => {
      if (!notificationBarIsOpen) {
        if (event.translationY > 0) {
          translateYInit.value = withTiming(0);
          runOnJS(setActive)(true);
        } else {
          translateYInit.value = withTiming(-heightOfBarInit);
          runOnJS(setActive)(false);
        }
      }
      if (notificationBarActive) {
        if (event.translationY > 0) {
          translateY.value = withTiming(heightOfBarIncrease);
          runOnJS(setOpen)(true);
        } else {
          translateY.value = withTiming(0);
          runOnJS(setOpen)(false);
        }
      }
    },
  });
  const panGestureEventInit = useAnimatedGestureHandler({
    onStart: (event, context) => {
      context.startY = translateYInit.value;
      context.startX = translateX.value;
      context.startYNotInit = translateY.value;
    },
    onActive: (event, context) => {
      if (
        (isHorizontalScrolling || Math.abs(event.translationX) > 20) &&
        !notificationBarActive
      ) {
        runOnJS(setHorizontalScrolling)(1);
        if (
          event.translationX + context.startX < 0 &&
          event.translationX + context.startX > width * -0.75
        ) {
          translateX.value = event.translationX + context.startX;
        }
      } else if (Math.abs(event.translationY) > 25) {
        if (
          !isHorizontalScrolling &&
          !notificationBarIsOpen &&
          event.translationY + context.startY > -heightOfBarInit &&
          event.translationY + context.startY < 0
        ) {
          runOnJS(setHorizontalScrolling)(0);

          translateYInit.value = event.translationY + context.startY;
        }

        if (
          (notificationBarActive || notificationBarIsOpen) &&
          event.translationY + context.startYNotInit >= 0 &&
          event.translationY + context.startYNotInit < heightOfBarIncrease
        ) {
          runOnJS(setHorizontalScrolling)(0);

          translateY.value = event.translationY + context.startYNotInit;
        }
      }
    },
    onEnd: (event, context) => {
      if (notificationBarIsOpen) {
        if (event.translationY < 0) {
          translateYInit.value = withTiming(-heightOfBarInit);
          runOnJS(setActive)(false);
        }
      }

      if (!notificationBarIsOpen) {
        if (event.translationY > 25 && Math.abs(event.translationX) < 25) {
          translateYInit.value = withTiming(0);
          runOnJS(setActive)(true);
        } else {
          translateYInit.value = withTiming(-heightOfBarInit);
          runOnJS(setActive)(false);
        }
      }

      if (notificationBarActive) {
        if (event.translationY > 25 && Math.abs(event.translationX) < 25) {
          translateY.value = withTiming(heightOfBarIncrease);
          runOnJS(setOpen)(true);
        } else {
          translateY.value = withTiming(0);
          runOnJS(setOpen)(false);
        }
      }

      if (!notificationBarActive) {
        if (event.translationX < 0 && Math.abs(event.translationY) < 20) {
          if (currentScreen < 2) {
            translateX.value = withTiming(homescreens[currentScreen + 1]);
            runOnJS(setScreen)(currentScreen + 1);
          }
        } else if (
          event.translationX > 0 &&
          Math.abs(event.translationY) < 20
        ) {
          if (currentScreen > 0) {
            translateX.value = withTiming(homescreens[currentScreen - 1]);
            runOnJS(setScreen)(currentScreen - 1);
          }
        }
      }

      runOnJS(setHorizontalScrolling)(0);
    },
  });

  //animated to link pan gesture with native property
  const animateInit = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: translateYInit.value,
        },
      ],
    };
  });

  const animateBGX = useAnimatedStyle(() => {
    return {
      transform: [{scale: 1.1}, {translateX: translateX.value}],
    };
  });

  //Interpolated Animation
  const animateBGBlur = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateYInit.value,
      [-heightOfBarInit, 0],
      [0, 0.5],
    );

    return {
      backgroundColor: `rgba(1,1,1,${opacity})`,
    };
  });

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            width: width + width * 0.5,
            height: height,
          },
          animateBGX,
        ]}>
        <Image
          source={require('../notification_bar_reanimated/assets/wallpaper.jpg')}
          style={{width: width + width * 0.75, height: height}}
        />
      </Animated.View>

      <View
        style={{
          width,
          height: height * 0.15,
          position: 'absolute',
          alignItems: 'center',
          bottom: 0,
          right: 10,
        }}>
        <View style={{marginBottom: 30, flexDirection: 'row'}}>
          {[0, 1, 2].map(elem => {
            return (
              <View
                key={elem}
                style={[
                  {
                    borderColor: 'white',
                    width: 9,
                    height: 9,
                    borderWidth: 1,
                    borderRadius: 4.5,
                    marginLeft: 10,
                  },
                  currentScreen === elem ? {backgroundColor: 'white'} : {},
                ]}
              />
            );
          })}
        </View>
        <View
          style={{
            flexDirection: 'row',
          }}>
          <Image
            source={require('../notification_bar_reanimated/assets/homescreen-icon-phone.png')}
            style={{width: 55, height: 55, marginLeft: 20}}
          />
          <Image
            source={require('../notification_bar_reanimated/assets/homescreen-icon-message.png')}
            style={{width: 55, height: 55, marginLeft: 20}}
          />
          <Image
            source={require('../notification_bar_reanimated/assets/homescreen-icon-gallery.png')}
            style={{width: 55, height: 55, marginLeft: 20}}
          />
          <Image
            source={require('../notification_bar_reanimated/assets/homescreen-icon-camera.png')}
            style={{width: 55, height: 55, marginLeft: 20}}
          />
        </View>
      </View>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {width: width, height: height},
          animateBGBlur,
        ]}
      />
      <PanGestureHandler onGestureEvent={panGestureEventInit}>
        <Animated.View style={[{height: height + height * 0.28}, animateInit]}>
          <Pressable
            style={{flex: 1}}
            onPress={e => {
              let canClose = false;
              if (
                notificationBarIsOpen &&
                e.nativeEvent.pageY >= heightOfBarInit + heightOfBarIncrease
              ) {
                translateY.value = withTiming(0);
                setOpen(false);
                canClose = true;
              }

              if (
                (!notificationBarIsOpen || canClose) &&
                notificationBarActive &&
                e.nativeEvent.pageY >= heightOfBarInit
              ) {
                translateYInit.value = withTiming(-heightOfBarInit);
                setActive(false);
              }
            }}>
            <View>
              <StatusBar hidden />

              <MainFrame
                translateY={translateY}
                panGestureEvent={panGestureEvent}
                colors={colors}
                setTheme={setTheme}
                theme={theme}
                notificationBarActive={notificationBarActive}
              />
            </View>
          </Pressable>
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

function MainFrame({
  colors,
  translateY,
  panGestureEvent,
  setTheme,
  theme,
  notificationBarActive,
}) {
  //Local Reactive States
  const {width, height} = useWindowDimensions();
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  //Shared Animation Value
  const translateX = useSharedValue(-5);

  //Utils
  const icons = [
    {
      name: 'Wi-fi',
      icon_active: 'wifi-strength-4',
      icon_type: 'material-community',
    },
    {
      name: 'Mobile Data',
      icon_active: 'swap-vertical',
      icon_type: 'material-community',
    },
    {
      name: 'Bluetooth',
      icon_active: 'bluetooth',
      icon_type: 'material-community',
    },
    {
      name: 'FlashLight',
      icon_active: 'torch',
      icon_type: 'material-community',
    },
    {
      name: 'Auto Rotate',
      icon_active: 'phone-rotate-landscape',

      icon_type: 'material-community',
    },
    {
      name: 'Battery Saver',
      icon_active: 'battery-plus-variant',

      icon_type: 'material-community',
    },
    {
      name: 'Airplane mode',
      icon_active: 'airplane',
      icon_type: 'material-community',
    },
    {
      name: 'Dark Mode',
      icon_active: 'theme-light-dark',
      icon_type: 'material-community',
    },
    {
      name: 'Video Enchacement',
      icon_active: 'switch',
      icon_type: 'entypo',
    },
    {
      name: 'Location',
      icon_active: 'location-outline',
      icon_type: 'ionicon',
    },
    {
      name: 'Do Not Disturb',
      icon_active: 'minus-circle-outline',
      icon_type: 'material-community',
    },
    {
      name: 'Screencast',
      icon_active: 'cast',
      icon_type: 'material-community',
    },
    {
      name: 'Personal Hotspot',
      icon_active: 'broadcast',
      icon_type: 'material-community',
    },
    {
      name: 'NFC',
      icon_active: 'nfc',
      icon_type: 'material-community',
    },
    {
      name: 'Zen Mode',
      icon_active: 'peace',
      icon_type: 'material-community',
    },
    {
      name: 'Screen recording',
      icon_active: 'video-box',
      icon_type: 'material-community',
    },
    {
      name: 'TV Remote\nDisconnected',
      icon_active: 'remote-tv',
      icon_type: 'material-community',
    },
    {
      name: 'Nearby Share',
      icon_active: 'google-nearby',
      icon_type: 'material-community',
    },
    {
      name: 'Work Mode',
      icon_active: 'suitcase',
      icon_type: 'entypo',
    },
    {
      name: 'Life Mode',
      icon_active: 'home-heart',
      icon_type: 'material-community',
    },
  ];

  //Get the Date
  useEffect(() => {
    let today = new Date();
    let dateString = '';
    switch (today.getDay()) {
      case 0:
        dateString += 'Sunday';
        break;
      case 1:
        dateString += 'Monday';
        break;
      case 2:
        dateString += 'Tuesday';
        break;
      case 3:
        dateString += 'Wednesday';
        break;
      case 4:
        dateString += 'Thursday';
        break;
      case 5:
        dateString += 'Friday';
        break;
      default:
        dateString += 'Saturday';
        break;
    }
    dateString += ', ' + today.toDateString().slice(4, 10);
    setDate(dateString);
  }, []);

  //Set Interval to run Clock in Notification Bar
  useEffect(() => {
    let today = new Date();
    const timeout = setInterval(() => {
      today = new Date();
      setTime(today.toTimeString().slice(0, 5));
    }, 60000);

    setTime(today.toTimeString().slice(0, 5));

    return () => {
      clearInterval(timeout);
    };
  }, []);

  //PanGesture Handler
  const brightnessBarEvents = useAnimatedGestureHandler({
    onStart: (event, context) => {
      context.startX = translateX.value;
    },
    onActive: (event, context) => {
      if (
        event.translationX + context.startX > -5 &&
        event.translationX + context.startX < width * 0.53
      )
        translateX.value = event.translationX + context.startX;
    },
    onEnd: () => {},
  });

  //AnimatedStyle to link translateY with height
  const animateHeight = useAnimatedStyle(() => {
    return {
      height: height * 0.28 + translateY.value,
    };
  });

  //AnimatedStyle to line translateX with Brightness Bar
  const animatedBrightnessBar = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: translateX.value,
        },
      ],
    };
  });

  //Interpolated Animated Styles
  const animateOpacityFadeIn = useAnimatedStyle(() => {
    let opa = interpolate(translateY.value, [200, 230, 200], [0, 1, 0]);
    return {
      opacity: opa,
    };
  });

  const animateOpacityFadeOut = useAnimatedStyle(() => {
    let opa = interpolate(translateY.value, [0, 230, 0], [1, 0, 1]);
    return {
      opacity: opa,
    };
  });

  const animateY = useAnimatedStyle(() => {
    let y = interpolate(translateY.value, [0, 230, 0], [-100, 0, -100]);
    return {
      transform: [
        {
          translateY: y,
        },
      ],
    };
  });

  const animateMargin = useAnimatedStyle(() => {
    let mr = interpolate(translateY.value, [0, 230, 0], [-5, 20, -5]);
    let mt = interpolate(translateY.value, [0, 230, 0], [10, 35, 10]);
    return {
      marginRight: mr,
      marginBottom: mt,
    };
  });

  const animatedIconConSize = useAnimatedStyle(() => {
    let size = [
      interpolate(
        translateY.value,
        [0, 230, 0],
        [width * 0.9, width * 0.96, width * 0.9],
      ),
      interpolate(
        translateY.value,
        [0, 230, 0],
        [height * 0.07, height * 0.33, height * 0.07],
      ),
    ];
    let left = interpolate(translateY.value, [0, 230, 0], [-7.5, 0, -7.5]);
    let top = interpolate(translateY.value, [0, 230, 0], [20, 30, 20]);

    return {
      width: size[0],
      height: size[1],
      marginLeft: left,
      marginTop: top,
    };
  });

  const animateWidthForBrightnessI = useAnimatedStyle(() => {
    let w = interpolate(
      translateX.value,
      [-5, width * 0.53, -5],
      [0, width * 0.56, 0],
    );

    return {
      width: w,
    };
  });

  const animateWidthForBrightnessD = useAnimatedStyle(() => {
    let w = interpolate(
      translateX.value,
      [-5, width * 0.53, -5],
      [width * 0.56, 0, width * 0.56],
    );

    return {
      width: w,
    };
  });

  return (
    <PanGestureHandler onGestureEvent={panGestureEvent}>
      <Animated.View
        style={[
          {
            backgroundColor: colors.background,
            width: width * 0.95,
            marginLeft: 8,
            borderRadius: 20,
            marginBottom: 10,
            paddingHorizontal: 25,
            paddingTop: 14,
          },
          animateHeight,
        ]}>
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'flex-end',
              position: 'absolute',
              left: 30,
            },
            animateY,
          ]}>
          <Text style={{fontSize: 32, color: colors.text, fontWeight: 600}}>
            {time + ' '}
          </Text>
          <Text
            style={[
              {
                fontSize: 16,
                color: colors.text,
                fontWeight: 400,
                marginBottom: 5,
              },
            ]}>
            {date}
          </Text>
        </Animated.View>
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            },
            animateOpacityFadeOut,
          ]}>
          <Animated.Text
            style={[
              {
                fontSize: 16,
                color: colors.text,
                fontWeight: 600,
                marginTop: 10,
              },
            ]}>
            {date}
          </Animated.Text>
          <Icon
            name="network-cell"
            color={colors.text}
            size={18}
            style={{marginTop: 10}}
          />
        </Animated.View>
        <Animated.View
          style={[
            {
              flexDirection: 'row',
              overflow: 'hidden',
              flexWrap: 'wrap',
            },
            animatedIconConSize,
          ]}>
          {icons.map((icon, index) => {
            return (
              <BarIcon
                icon={icon}
                key={index}
                animateOpacityFadeIn={animateOpacityFadeIn}
                animateMargin={animateMargin}
                index={index}
                theme={theme}
                setTheme={setTheme}
                colors={colors}
                notificationBarActive={notificationBarActive}
              />
            );
          })}
        </Animated.View>
        <Pressable
          style={{
            position: 'absolute',
            bottom: 65,
            left: 30,
          }}
          onPress={e => {
            let position = e.nativeEvent.pageX - width * 0.22;
            if (position > -5 && position < width * 0.53)
              translateX.value = withTiming(position);
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <Icon name="ios-sunny" color="grey" type="ionicon" size={22} />
            <View
              style={{
                marginHorizontal: width * 0.06,
                height: 17,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <PanGestureHandler onGestureEvent={brightnessBarEvents}>
                <Animated.View
                  style={[
                    {
                      backgroundColor: colors.notification,
                      width: 17,
                      position: 'absolute',
                      height: 17,
                      zIndex: 1,
                      borderRadius: 8.5,
                      shadowColor: 'white',
                    },
                    animatedBrightnessBar,
                  ]}
                />
              </PanGestureHandler>
              <Animated.View
                style={[
                  {
                    width: 0,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'red',
                  },
                  animateWidthForBrightnessI,
                ]}
              />
              <Animated.View
                style={[
                  {
                    width: width * 0.56,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: 'grey',
                  },
                  animateWidthForBrightnessD,
                ]}
              />
            </View>
            <Icon
              name="ios-sunny"
              color={colors.text}
              type="ionicon"
              size={22}
            />
          </View>
        </Pressable>
        <View
          style={{
            flexDirection: 'row',
            position: 'absolute',
            justifyContent: 'space-between',
            width: width * 0.8,
            bottom: 20,
            left: 30,
          }}>
          <Text style={{color: colors.text}}>Vodafone IN</Text>
          <Animated.View
            style={[
              {flexDirection: 'row', position: 'absolute', right: 38},
              animateOpacityFadeIn,
            ]}>
            <Icon
              name="user-circle-o"
              type="font-awesome"
              color={colors.primary}
              size={20}
            />
            <Icon
              name="edit"
              color={colors.icon_color}
              size={20}
              style={{marginLeft: 20}}
            />
          </Animated.View>
          <Icon
            name="settings"
            color={colors.icon_color}
            size={20}
            style={{marginLeft: 20}}
          />
        </View>

        <Animated.View
          style={[
            {
              width: 40,
              height: 5,
              backgroundColor: 'red',
              borderRadius: 10,
              position: 'absolute',
              bottom: 10,
              alignSelf: 'center',
            },
            animateOpacityFadeOut,
          ]}
        />
      </Animated.View>
    </PanGestureHandler>
  );
}

function BarIcon({
  icon,
  animateOpacityFadeIn,
  animateMargin,
  index,
  theme,
  setTheme,
  colors,
  notificationBarActive,
}) {
  //Local Reactive State
  const scroll = useRef();
  const [isActive, setIsActive] = useState(false);

  //Shared Animation Value
  const rx = useSharedValue('180deg');

  //To Set Theme
  useEffect(() => {
    //Need to Optimize
    // let interval,
    //   scrollPos = 0,
    //   count = 0;
    // scroll.current.scrollTo({
    //   x: 0,
    //   y: 0,
    //   animated: true,
    // });
    // if (!(icon.name.length <= 11)) {
    //   interval = setInterval(() => {
    //     if (count < 20) {
    //       scrollPos = (scrollPos + 2.5) % 50;

    //       scroll.current.scrollTo({
    //         x: scrollPos,
    //         y: 0,
    //         animated: true,
    //       });
    //     }

    //     count++;
    //     if (count === 48) count = 0;
    //   }, 175);
    // }

    if (theme && icon.name === 'Dark Mode') {
      setIsActive(true);
    } else {
      setIsActive(false);
    }

    // return () => {
    //   clearInterval(interval);
    // };
  }, []);

  return (
    <Animated.View
      key={icon.name}
      style={[
        {alignItems: 'center'},
        animateMargin,
        index > 5 ? animateOpacityFadeIn : {},
      ]}>
      <Pressable
        onPress={() => {
          if (icon.name === 'Dark Mode') {
            setTheme(theme ^ 1);
            if (theme) {
              rx.value = withTiming('0deg');
            } else {
              rx.value = withTiming('180deg');
            }
          }
          setIsActive(!isActive);
          // DeviceBrightness.getBrightnessLevel().then(function (luminous) {
          //   // Get current brightness level
          //   // 0 ~ 1
          //   console.log(luminous);
          // });
        }}>
        <View
          style={[
            {
              width: 44,
              height: 44,
              borderRadius: 24,
              backgroundColor: !isActive ? colors.card : colors.notification,
              justifyContent: 'center',
            },
            icon.name === 'Dark Mode' ? {transform: [{rotateZ: rx.value}]} : {},
          ]}>
          <Icon
            name={icon.icon_active}
            type={icon.icon_type}
            size={20}
            color={!isActive ? colors.icon_color : 'white'}
          />
        </View>
      </Pressable>
      <ScrollView
        scrollEventThrottle={16}
        ref={scroll}
        horizontal
        style={{width: 60}}>
        <Animated.Text
          numberOfLines={1}
          ellipsizeMode="clip"
          style={[
            {
              fontSize: 10,
              color: colors.text,
              fontWeight: 600,
              marginTop: 5,
              textAlign: icon.name.length <= 11 ? 'center' : 'justify',
              width: icon.name.length <= 11 ? 60 : 100,
            },
            animateOpacityFadeIn,
          ]}>
          {icon.name}
        </Animated.Text>
      </ScrollView>
    </Animated.View>
  );
}

export default App;
