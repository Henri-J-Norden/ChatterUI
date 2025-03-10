import { AppSettings } from '@constants/GlobalValues'
import { Style } from '@globals'
import { BertTokenizer } from 'bert-tokenizer'
import * as FS from 'expo-file-system'
import { InferenceSession, Tensor } from 'onnxruntime-react-native'
import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { ScrollView, TextInput } from 'react-native-gesture-handler'
import { useMMKVBoolean } from 'react-native-mmkv'
const emotions = [
    'admiration',
    'amusement',
    'anger',
    'annoyance',
    'approval',
    'caring',
    'confusion',
    'curiosity',
    'desire',
    'disappointment',
    'disapproval',
    'disgust',
    'embarrassment',
    'excitement',
    'fear',
    'gratitude',
    'grief',
    'joy',
    'love',
    'nervousness',
    'optimism',
    'pride',
    'realization',
    'relief',
    'remorse',
    'sadness',
    'surprise',
    'neutral',
]

type infovalue = {
    emotion: string
    value: number
}

const Classifier = () => {
    const [session, setSession] = useState<InferenceSession | undefined>(undefined)
    const [info, setInfo] = useState<infovalue[]>([])
    const [inputText, setInputText] = useState<string>('')
    const [timescore, settimescore] = useState<number>(0)
    const Tokenizer = useRef(
        new BertTokenizer('this library is patched so this doesn not matter')
    ).current
    const [devMode, setDevMode] = useMMKVBoolean(AppSettings.DevMode)
    const loadSession = async () => {
        const session = await InferenceSession.create(
            `${FS.documentDirectory}models/model_quantized.onnx`,
            { executionMode: 'parallel' }
        )
        setSession(session)
    }

    React.useEffect(() => {
        loadSession()
    }, [])

    const runClassifier = async () => {
        if (!session) return

        const tokenized = Tokenizer.tokenize(inputText)

        const mask = new Array(tokenized.length).fill(1)
        const data = {
            input_ids: new Tensor('int64', tokenized, [1, tokenized.length]),
            attention_mask: new Tensor('int64', mask, [1, tokenized.length]),
        }

        const timer = performance.now()
        const result = session.run(data, ['logits'])

        const output = (await result).logits.data
        settimescore(performance.now() - timer)
        const info: infovalue[] = []
        output.forEach((value, index) => {
            const key = emotions[index]
            if (typeof value === 'number') info.push({ emotion: key, value: value })
        })
        info.sort((a, b) => b.value - a.value)
        setInfo(info)
    }

    return (
        <ScrollView style={Style.view.mainContainer}>
            <Text style={styles.text}>Classifier</Text>
            {devMode && (
                <View>
                    <Text style={styles.text}>
                        To use this, We have a hacky solution: import model_quantized.onnx via the
                        Local API (it isn't an LLM, but we reuse that folder). Then enter this pagea
                        and it should work.
                    </Text>
                    <Text style={styles.text}>Get the model here:</Text>
                    <TouchableOpacity>
                        <Text
                            style={styles.text}
                            onPress={() => {
                                Linking.openURL(
                                    'https://huggingface.co/Cohee/distilbert-base-uncased-go-emotions-onnx'
                                )
                            }}>
                            https://huggingface.co/Cohee/distilbert-base-uncased-go-emotions-onnx
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            <TextInput
                multiline
                numberOfLines={5}
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
            />
            <TouchableOpacity
                style={{ ...styles.input, alignItems: 'center', padding: 4 }}
                onPress={runClassifier}>
                <Text style={{ color: 'white' }}>Classify</Text>
            </TouchableOpacity>
            {timescore !== 0 && (
                <View
                    style={{
                        padding: 8,
                        backgroundColor: Style.getColor('primary-surface2'),
                        marginVertical: 2,
                    }}>
                    <Text style={{ color: 'white' }}>Time Taken: {timescore.toPrecision(4)}ms</Text>
                </View>
            )}

            {info.map((item, index) => (
                <View
                    key={index}
                    style={{
                        padding: 8,
                        backgroundColor: Style.getColor('primary-surface2'),
                        marginVertical: 1,
                    }}>
                    <Text style={styles.text}>Emotion: {item.emotion}</Text>
                    <Text style={styles.text}>Score: {item.value}</Text>
                </View>
            ))}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    text: {
        color: Style.getColor('primary-text1'),
        paddingBottom: 8,
    },
    input: {
        borderColor: 'white',
        borderRadius: 8,
        borderWidth: 1,
        color: 'white',
        marginBottom: 16,
    },
})

export default Classifier
